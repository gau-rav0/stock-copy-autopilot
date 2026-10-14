import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const id = (value: number) => `11111111-1111-4111-8111-${String(value).padStart(12, "0")}`;

test("database security and workflow regression checks", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select current_user::text $$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant execute on all functions in schema auth to anon, authenticated, service_role;
    `);
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(directory)).sort()) {
      if (!file.endsWith(".sql") || file === "0008_conviction_alert_webhook.sql") continue;
      const sql = (await readFile(new URL(file, directory), "utf8"))
        .replace(/create extension if not exists "pgcrypto";/g, "");
      await db.exec(sql);
    }
    await db.exec(`grant all on all tables in schema public to anon, authenticated, service_role;`);
    await db.query("insert into public.users(id,email,role) values ($1,'reader@example.test','follower'),($2,'admin@example.test','admin'),($3,'creator@example.test','follower'),($4,'broken@example.test','follower')", [id(1), id(2), id(3), id(4)]);
    await db.query("insert into public.profiles(id,user_id,display_name,slug,investing_style,subscription_fee_inr) values ($1,$3,'Live','live','growth',0),($2,$3,'Paid','paid','growth',100)", [id(10), id(11), id(2)]);
    await db.query("insert into public.portfolios(id,profile_id,is_demo) values ($1,$3,false),($2,$4,false)", [id(20), id(21), id(10), id(11)]);
    async function asUser(userId: string) {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userId]);
      await db.exec("set role authenticated");
    }
    async function asService() { await db.exec("reset role; set role service_role"); }
    async function scalar(sql: string, params: unknown[] = []) {
      return (await db.query<{ value: unknown }>(sql, params)).rows[0]?.value;
    }

    await t.test("public clients cannot assign creator review fields or forged evidence", async () => {
      await db.exec("set role anon");
      await assert.rejects(db.exec("insert into creator_applications(email,method,status) values ('fake@example.test','cas','Accepted')"), /row-level security/);
      await assert.rejects(db.exec("insert into creator_application_holdings(application_id,name) values ('11111111-1111-4111-8111-000000000099','fake')"), /row-level security/);
      await assert.rejects(db.exec("insert into waitlist_signups(email) values ('fake@example.test')"), /row-level security/);
    });
    await t.test("free follows are idempotent and maintain counts under authenticated RLS", async () => {
      await asUser(id(1));
      for (let index = 0; index < 2; index++) {
        await db.query("insert into followers(follower_user_id,profile_id) values ($1,$2) on conflict (follower_user_id,profile_id) do nothing", [id(1), id(10)]);
      }
      assert.equal(await scalar("select follower_count as value from profiles where id=$1", [id(10)]), 1);
      await assert.rejects(db.query("insert into followers(follower_user_id,profile_id) values ($1,$2)", [id(1), id(11)]), /row-level security/);
      await assert.rejects(db.query("insert into followers(follower_user_id,profile_id) values ($1,'00000000-0000-0000-0000-000000000101')", [id(1)]), /row-level security/);
      await db.query("delete from followers where profile_id=$1", [id(10)]);
      assert.equal(await scalar("select follower_count as value from profiles where id=$1", [id(10)]), 0);
      await assert.rejects(db.query("insert into followers(follower_user_id,profile_id,subscribed,subscription_id) values ($1,$2,true,'fake')", [id(1), id(10)]), /row-level security/);
    });
    await t.test("creator approval is restricted, atomic, repeatable, and preserves admins", async () => {
      await asService();
      await db.query("insert into creator_applications(id,email,creator_name,method,parsed_holdings,parse_status) values ($1,'CREATOR@EXAMPLE.TEST','A Creator','cas',$2,'parsed_pending_review')", [id(30), JSON.stringify([{ symbol: "INFY", name: "Infosys", quantity: 10, marketValue: 1000, weightPct: 100 }])]);
      await asUser(id(1));
      await assert.rejects(db.query("select * from approve_creator_application($1)", [id(30)]), /Admin access required/);
      await asUser(id(2));
      const first = await db.query<{ verified: boolean }>("select * from approve_creator_application($1)", [id(30)]);
      const second = await db.query<{ verified: boolean }>("select * from approve_creator_application($1)", [id(30)]);
      assert.deepEqual(first.rows, second.rows);
      assert.equal(first.rows[0].verified, true);
      assert.equal(await scalar("select count(*)::int as value from profiles where approved_application_id=$1", [id(30)]), 1);
      await asService();
      assert.equal(await scalar("select role as value from users where id=$1", [id(2)]), "admin");
      assert.equal(await scalar("select role as value from users where id=$1", [id(3)]), "creator");
      await db.query("insert into creator_applications(id,email,method,parsed_holdings) values ($1,'broken@example.test','manual',$2)", [id(31), JSON.stringify([{ symbol: "INFY", weightPct: "invalid-number" }])]);
      await asUser(id(2));
      await assert.rejects(db.query("select * from approve_creator_application($1)", [id(31)]), /invalid input syntax/);
      await asService();
      assert.equal(await scalar("select status as value from creator_applications where id=$1", [id(31)]), "Pending");
      assert.equal(await scalar("select role as value from users where id=$1", [id(4)]), "follower");
      assert.equal(await scalar("select count(*)::int as value from profiles where user_id=$1", [id(4)]), 0);
    });
    await t.test("broker preferences cannot self-authorize or reset provider authorization", async () => {
      await asUser(id(1));
      await assert.rejects(db.query("insert into broker_connections(user_id,broker,purpose,status) values ($1,'zerodha','follower','active')", [id(1)]), /row-level security/);
      await db.exec("select * from save_broker_preference('zerodha','follower','My account')");
      assert.equal(await scalar("select status as value from broker_connections where user_id=$1", [id(1)]), "awaiting_authorization");
      await db.query("update broker_connections set status='active' where user_id=$1", [id(1)]);
      assert.equal(await scalar("select status as value from broker_connections where user_id=$1", [id(1)]), "awaiting_authorization");
      await assert.rejects(db.exec("select * from save_broker_preference('zerodha','creator','fake')"), /Verified creator required/);
      await asService();
      await db.query("update broker_connections set status='active' where user_id=$1", [id(1)]);
      await asUser(id(1));
      await db.exec("select * from save_broker_preference('zerodha','follower','New label')");
      assert.equal(await scalar("select status as value from broker_connections where user_id=$1", [id(1)]), "active");
    });
    await t.test("payment activation validates stored amount and does not resurrect an unfollow on replay", async () => {
      await asService();
      await db.query("insert into checkout_orders(razorpay_order_id,follower_user_id,profile_id,amount_paise,currency) values ('order_test',$1,$2,10000,'INR')", [id(1), id(11)]);
      await assert.rejects(db.query("select activate_checkout_order('order_test',$1,$2,1,'INR')", [id(1), id(11)]), /does not match/);
      await assert.rejects(db.query("select activate_checkout_order('order_test',$1,$2,10000,'USD')", [id(1), id(11)]), /does not match/);
      assert.equal(await scalar("select count(*)::int as value from subscriptions"), 0);
      assert.equal(await scalar("select activate_checkout_order('order_test',$1,$2,10000,'INR') as value", [id(1), id(11)]), true);
      await asUser(id(1));
      await db.query("delete from followers where profile_id=$1", [id(11)]);
      await assert.rejects(db.query("select activate_checkout_order('order_test',$1,$2,10000,'INR')", [id(1), id(11)]), /permission denied/);
      await asService();
      assert.equal(await scalar("select activate_checkout_order('order_test',$1,$2,10000,'INR') as value", [id(1), id(11)]), false);
      assert.equal(await scalar("select count(*)::int as value from followers where profile_id=$1", [id(11)]), 0);
      assert.equal(await scalar("select count(*)::int as value from subscriptions"), 1);
      await asUser(id(1));
      await assert.rejects(db.query("insert into followers(follower_user_id,profile_id,subscribed,subscription_id) values ($1,$2,true,'order_fake')", [id(1), id(11)]), /row-level security/);
      await db.query("insert into followers(follower_user_id,profile_id,subscribed,subscription_id) values ($1,$2,true,'order_test')", [id(1), id(11)]);
      assert.equal(await scalar("select count(*)::int as value from followers where profile_id=$1", [id(11)]), 1);
    });
    await t.test("alerts queue with the transaction, claim once, and honour changed consent", async () => {
      await asUser(id(1));
      await db.query("insert into followers(follower_user_id,profile_id) values ($1,$2)", [id(1), id(10)]);
      await assert.rejects(db.query("select * from claim_alert_deliveries($1)", [id(40)]), /permission denied/);
      await asService();
      await db.query("insert into transactions(id,portfolio_id,ticker,action,transaction_date,is_conviction_alert) values ($1,$2,'INFY','buy',current_date,true)", [id(40), id(20)]);
      assert.equal(await scalar("select count(*)::int as value from alert_delivery_attempts where transaction_id=$1", [id(40)]), 1);
      assert.equal((await db.query("select * from claim_alert_deliveries($1)", [id(40)])).rows.length, 1);
      assert.equal((await db.query("select * from claim_alert_deliveries($1)", [id(40)])).rows.length, 0);
      await db.query("update alert_delivery_attempts set last_attempt_at=now()-interval '11 minutes' where transaction_id=$1", [id(40)]);
      assert.equal((await db.query("select * from claim_alert_deliveries($1)", [id(40)])).rows.length, 1);
      await asUser(id(1));
      await db.query("insert into notification_preferences(user_id,trade_alerts_email) values ($1,false)", [id(1)]);
      await asService();
      assert.equal((await db.query("select * from claim_alert_deliveries($1)", [id(40)])).rows.length, 0);
      assert.equal(await scalar("select status as value from alert_delivery_attempts where transaction_id=$1", [id(40)]), "skipped");
      await db.query("insert into transactions(id,portfolio_id,ticker,action,transaction_date,is_conviction_alert) values ($1,$2,'INFY','buy',current_date,true)", [id(41), id(20)]);
      assert.equal(await scalar("select count(*)::int as value from alert_delivery_attempts where transaction_id=$1", [id(41)]), 0);
    });
  } finally { await db.close(); }
});
