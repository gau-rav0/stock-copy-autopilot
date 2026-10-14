import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deliverTradeAlert } from "../lib/trade-alert-delivery";

const transaction = { id: "tx-1", portfolio_id: "portfolio-1", ticker: "INFY", action: "buy", alert_text: '<script>unsafe</script>' };
const recipient = { follower_user_id: "user-1", recipient_email: "test@example.test", attempts: 1, last_attempt_at: "2026-10-09T00:00:00Z" };

function clientFixture(options: { claimError?: boolean; writeError?: boolean } = {}) {
  const updates: Record<string, unknown>[] = [];
  let claims = 0;
  const client = {
    rpc: async () => { claims++; return { data: [recipient], error: options.claimError ? { message: "database unavailable" } : null }; },
    from: (table: string) => {
      if (table === "portfolios") return { select: () => ({ eq: () => ({ single: async () => ({ data: { is_demo: false, profiles: { display_name: "<Creator>" } }, error: null }) }) }) };
      return { update: (values: Record<string, unknown>) => {
        updates.push(values);
        let filters = 0;
        const builder = { eq: () => ++filters === 5 ? Promise.resolve({ error: options.writeError ? { message: "write failed" } : null }) : builder };
        return builder;
      } };
    },
  } as unknown as SupabaseClient;
  return { client, updates, getClaims: () => claims };
}
function setEnv(context: TestContext, key: string, value: string) {
  const original = process.env[key];
  process.env[key] = value;
  context.after(() => { if (original === undefined) delete process.env[key]; else process.env[key] = original; });
}
function configure(context: TestContext) {
  setEnv(context, "RESEND_API_KEY", "re_test");
  setEnv(context, "UNSUBSCRIBE_SECRET", "test-secret");
  setEnv(context, "NEXT_PUBLIC_SITE_URL", "https://example.test");
}

test("missing alert configuration does not consume claims", async (context) => {
  setEnv(context, "RESEND_API_KEY", "");
  const fixture = clientFixture();
  await assert.rejects(deliverTradeAlert(fixture.client, transaction), /required for alerts/);
  assert.equal(fixture.getClaims(), 0);
});

test("alert claim errors prevent provider calls", async (context) => {
  configure(context);
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; return new Response(); });
  await assert.rejects(deliverTradeAlert(clientFixture({ claimError: true }).client, transaction), /Could not claim/);
  assert.equal(calls, 0);
});

test("alert batches escape HTML and reuse provider idempotency keys", async (context) => {
  configure(context);
  const keys: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    keys.push(new Headers(options.headers).get("Idempotency-Key")!);
    const messages = JSON.parse(options.body as string);
    assert.ok(messages[0].html.includes("&lt;script&gt;unsafe&lt;/script&gt;"));
    assert.ok(messages[0].html.includes("&lt;Creator&gt;"));
    assert.equal(messages[0].to[0], "test@example.test");
    return new Response(JSON.stringify({ data: [{ id: "email-1" }] }), { status: 200 });
  });
  const fixture = clientFixture();
  assert.equal((await deliverTradeAlert(fixture.client, transaction)).sent, 1);
  assert.equal((await deliverTradeAlert(fixture.client, transaction)).sent, 1);
  assert.equal(keys[0], keys[1]);
  assert.equal(fixture.updates[0].provider_message_id, "email-1");
});

test("provider and audit failures are surfaced", async (context) => {
  configure(context);
  context.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ name: "validation_error", message: "invalid recipient" }), { status: 422 }));
  const failed = clientFixture();
  assert.equal((await deliverTradeAlert(failed.client, transaction)).failed, 1);
  assert.equal(failed.updates[0].status, "failed");
  context.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ data: [{ id: "email-1" }] }), { status: 200 }));
  await assert.rejects(deliverTradeAlert(clientFixture({ writeError: true }).client, transaction), /Could not record alert delivery/);
});

