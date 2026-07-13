import { createHmac } from "crypto";
import { Resend } from "resend";

type AdminClient = any;

type Transaction = {
  id: string;
  portfolio_id: string;
  ticker: string;
  action: string;
  alert_text: string | null;
};

type Follower = {
  follower_user_id: string;
  users: { email: string | null } | null;
};

const MAX_ATTEMPTS = 3;
const MAX_BATCH_SIZE = 100;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
}[character] ?? character));

function unsubscribeUrl(userId: string) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !siteUrl) return null;

  const signature = createHmac("sha256", secret).update(userId).digest("hex");
  return `${siteUrl}/api/unsubscribe?user=${encodeURIComponent(userId)}&sig=${signature}`;
}

function chunk<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function emailHtml({ creatorName, action, ticker, alertText, unsubscribe }: {
  creatorName: string;
  action: string;
  ticker: string;
  alertText: string;
  unsubscribe: string;
}) {
  const positive = action === "buy" || action === "add";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#009d55;color:#fff;padding:20px;text-align:center"><h2 style="margin:0">New creator update</h2></div>
      <div style="padding:24px;color:#333">
        <p><strong>${escapeHtml(creatorName)}</strong> shared a read-only portfolio update.</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:6px;margin:20px 0">
          <p style="margin:0 0 10px;font-size:18px"><strong>Action:</strong> <span style="color:${positive ? "#009d55" : "#c24040"}">${escapeHtml(action.toUpperCase())}</span></p>
          <p style="margin:0 0 10px;font-size:18px"><strong>Ticker:</strong> ${escapeHtml(ticker)}</p>
          <p style="margin:0"><strong>Note:</strong> ${escapeHtml(alertText)}</p>
        </div>
        <p style="font-size:12px;color:#666">This is a read-only update, not investment advice or an instruction to trade.</p>
        <p style="font-size:12px"><a href="${unsubscribe}">Stop receiving trade alerts</a></p>
      </div>
    </div>`;
}

async function setDeliveryStatus(
  supabase: AdminClient,
  transactionId: string,
  followerUserId: string,
  values: Record<string, unknown>
) {
  await supabase
    .from("alert_delivery_attempts")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("transaction_id", transactionId)
    .eq("follower_user_id", followerUserId);
}

export async function deliverTradeAlert(supabase: AdminClient, transaction: Transaction) {
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("profile_id, profiles!inner(display_name)")
    .eq("id", transaction.portfolio_id)
    .single();
  if (portfolioError || !portfolio) throw new Error("Portfolio not found for trade alert");

  const profileId = portfolio.profile_id as string;
  const creatorName = (portfolio.profiles as { display_name?: string } | null)?.display_name ?? "A creator you follow";
  const { data: followers, error: followersError } = await supabase
    .from("followers")
    .select("follower_user_id, users!inner(email)")
    .eq("profile_id", profileId);
  if (followersError) throw new Error("Followers could not be loaded");

  const candidates = (followers ?? []) as Follower[];
  if (!candidates.length) return { queued: 0, sent: 0, skipped: 0, failed: 0 };

  const followerIds = candidates.map((follower) => follower.follower_user_id);
  const [{ data: preferences, error: preferencesError }, { data: existing, error: existingError }] = await Promise.all([
    supabase.from("notification_preferences").select("user_id, trade_alerts_email").in("user_id", followerIds),
    supabase.from("alert_delivery_attempts").select("follower_user_id, status, attempts").eq("transaction_id", transaction.id).in("follower_user_id", followerIds),
  ]);
  if (preferencesError || existingError) throw new Error("Alert delivery state could not be loaded");

  const optedOut = new Set((preferences ?? []).filter((preference: any) => preference.trade_alerts_email === false).map((preference: any) => preference.user_id));
  const existingByFollower = new Map((existing ?? []).map((delivery: any) => [delivery.follower_user_id, delivery]));
  const recipients = candidates.filter((follower) => {
    const delivery = existingByFollower.get(follower.follower_user_id) as { status: string; attempts: number } | undefined;
    return Boolean(follower.users?.email) && !optedOut.has(follower.follower_user_id) && delivery?.status !== "sent" && (delivery?.attempts ?? 0) < MAX_ATTEMPTS;
  });

  const skipped = candidates.length - recipients.length;
  if (!recipients.length) return { queued: 0, sent: 0, skipped, failed: 0 };

  const now = new Date().toISOString();
  await supabase.from("alert_delivery_attempts").upsert(
    recipients.map((follower) => ({
      transaction_id: transaction.id,
      follower_user_id: follower.follower_user_id,
      recipient_email: follower.users!.email,
      status: "queued",
      error_message: null,
      attempts: ((existingByFollower.get(follower.follower_user_id) as { attempts?: number } | undefined)?.attempts ?? 0) + 1,
      last_attempt_at: now,
      updated_at: now,
    })),
    { onConflict: "transaction_id,follower_user_id" }
  );

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERTS_EMAIL_FROM ?? "Follow Verified Investors <onboarding@resend.dev>";
  if (!resendKey) {
    await Promise.all(recipients.map((follower) => setDeliveryStatus(supabase, transaction.id, follower.follower_user_id, { status: "failed", error_message: "RESEND_API_KEY is not configured" })));
    return { queued: recipients.length, sent: 0, skipped, failed: recipients.length };
  }

  const prepared = recipients.map((follower) => ({ follower, unsubscribe: unsubscribeUrl(follower.follower_user_id) }));
  const withoutUnsubscribe = prepared.filter((item) => !item.unsubscribe);
  if (withoutUnsubscribe.length) {
    await Promise.all(withoutUnsubscribe.map(({ follower }) => setDeliveryStatus(supabase, transaction.id, follower.follower_user_id, { status: "failed", error_message: "UNSUBSCRIBE_SECRET or NEXT_PUBLIC_SITE_URL is not configured" })));
  }

  const ready = prepared.filter((item): item is typeof item & { unsubscribe: string } => Boolean(item.unsubscribe));
  const resend = new Resend(resendKey);
  let sent = 0;
  let failed = withoutUnsubscribe.length;
  for (const group of chunk(ready, MAX_BATCH_SIZE)) {
    const { data, error } = await resend.batch.send(group.map(({ follower, unsubscribe }) => ({
      from,
      to: [follower.users!.email!],
      subject: `Creator update: ${transaction.action.toUpperCase()} ${transaction.ticker}`,
      html: emailHtml({ creatorName, action: transaction.action, ticker: transaction.ticker, alertText: transaction.alert_text ?? "No additional explanation provided.", unsubscribe }),
      headers: {
        "List-Unsubscribe": `<${unsubscribe}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Entity-Ref-ID": `${transaction.id}-${follower.follower_user_id}`,
      },
    })));

    if (error || !data) {
      failed += group.length;
      await Promise.all(group.map(({ follower }) => setDeliveryStatus(supabase, transaction.id, follower.follower_user_id, { status: "failed", error_message: error?.message ?? "Email provider did not return message identifiers" })));
      continue;
    }

    sent += group.length;
    await Promise.all(group.map(({ follower }, index) => setDeliveryStatus(supabase, transaction.id, follower.follower_user_id, {
      status: "sent",
      provider_message_id: (data as any[])[index]?.id ?? null,
      error_message: null,
      delivered_at: new Date().toISOString(),
    })));
  }

  return { queued: recipients.length, sent, skipped, failed };
}

export async function retryFailedTradeAlerts(supabase: AdminClient) {
  const { data: pending, error } = await supabase
    .from("alert_delivery_attempts")
    .select("transaction_id")
    .in("status", ["queued", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .order("last_attempt_at", { ascending: true })
    .limit(50);
  if (error) throw new Error("Failed deliveries could not be loaded");

  const transactionIds = [...new Set((pending ?? []).map((row: any) => row.transaction_id))];
  let retried = 0;
  let sent = 0;
  for (const transactionId of transactionIds) {
    const { data: transaction } = await supabase
      .from("transactions")
      .select("id, portfolio_id, ticker, action, alert_text")
      .eq("id", transactionId)
      .maybeSingle();
    if (!transaction) continue;
    const result = await deliverTradeAlert(supabase, transaction as Transaction);
    retried += 1;
    sent += result.sent;
  }
  return { retried, sent };
}
