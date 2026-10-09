import { createHash, createHmac } from "crypto";
import { Resend } from "resend";

import type { SupabaseClient } from "@supabase/supabase-js";
type AdminClient = SupabaseClient;

type Transaction = {
  id: string;
  portfolio_id: string;
  ticker: string;
  action: string;
  alert_text: string | null;
};

type Recipient = {
  follower_user_id: string;
  recipient_email: string;
  attempts: number;
  last_attempt_at: string;
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
  supabase: AdminClient, transactionId: string, recipient: Recipient, values: Record<string, unknown>
) {
  const { error } = await supabase.from("alert_delivery_attempts")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("transaction_id", transactionId).eq("follower_user_id", recipient.follower_user_id)
    .eq("status", "queued").eq("attempts", recipient.attempts)
    .eq("last_attempt_at", recipient.last_attempt_at);
  if (error) throw new Error(`Could not record alert delivery: ${error.message}`);
}

export async function deliverTradeAlert(supabase: AdminClient, transaction: Transaction) {
  // Configuration failures must leave the durable queue untouched, so they do
  // not exhaust the three attempts before an operator restores configuration.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !process.env.UNSUBSCRIBE_SECRET || !process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error("RESEND_API_KEY, UNSUBSCRIBE_SECRET and NEXT_PUBLIC_SITE_URL are required for alerts");
  }
  const { data: portfolio, error: portfolioError } = await supabase.from("portfolios")
    .select("is_demo, profiles!inner(display_name)").eq("id", transaction.portfolio_id).single();
  if (portfolioError || !portfolio) throw new Error("Portfolio not found for trade alert");
  if (portfolio.is_demo) return { queued: 0, sent: 0, skipped: 0, failed: 0 };
  const creatorName = (portfolio.profiles as unknown as { display_name: string }).display_name;
  const { data: claims, error: claimError } = await supabase.rpc("claim_alert_deliveries", { p_transaction_id: transaction.id });
  if (claimError) throw new Error(`Could not claim alert recipients: ${claimError.message}`);
  const recipients = (claims ?? []) as Recipient[];
  const resend = new Resend(resendKey);
  let sent = 0;
  let failed = 0;
  for (const group of chunk(recipients, MAX_BATCH_SIZE)) {
    if (sent + failed > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    const messages = group.map((recipient) => {
      const unsubscribe = unsubscribeUrl(recipient.follower_user_id)!;
      return {
        from: process.env.ALERTS_EMAIL_FROM?.trim() || "Follow Verified Investors <onboarding@resend.dev>",
        to: [recipient.recipient_email],
        subject: `Creator update: ${transaction.action.toUpperCase()} ${transaction.ticker}`,
        html: emailHtml({ creatorName, action: transaction.action, ticker: transaction.ticker,
          alertText: transaction.alert_text ?? "No additional explanation provided.", unsubscribe }),
        headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    });
    // Stable across duplicate deliveries of the same batch; provider deduplication
    // also protects a retry after a successful send but failed audit write.
    const idempotencyKey = `fvi-${transaction.id}-${createHash("sha256").update(JSON.stringify(messages)).digest("hex")}`;
    const { data, error } = await resend.batch.send(messages, { idempotencyKey });
    if (error || !data || data.data.length !== group.length) {
      failed += group.length;
      await Promise.all(group.map((recipient) => setDeliveryStatus(supabase, transaction.id, recipient,
        { status: "failed", error_message: error?.message ?? "Incomplete email provider response" })));
      continue;
    }
    await Promise.all(group.map((recipient, index) => setDeliveryStatus(supabase, transaction.id, recipient, {
      status: "sent", provider_message_id: data.data[index].id, error_message: null, delivered_at: new Date().toISOString(),
    })));
    sent += group.length;
  }
  return { queued: recipients.length, sent, skipped: 0, failed };
}

export async function retryFailedTradeAlerts(supabase: AdminClient) {
  const { data: pending, error } = await supabase.from("alert_delivery_attempts")
    .select("transaction_id").in("status", ["queued", "failed"]).lt("attempts", MAX_ATTEMPTS)
    .or(`last_attempt_at.is.null,last_attempt_at.lt.${new Date(Date.now() - 600_000).toISOString()}`)
    .order("last_attempt_at", { ascending: true, nullsFirst: true }).limit(500);
  if (error) throw new Error("Failed deliveries could not be loaded");
  const transactionIds = [...new Set((pending ?? []).map((row) => row.transaction_id as string))].slice(0, 5);
  let retried = 0;
  let sent = 0;
  for (const transactionId of transactionIds) {
    const { data: transaction, error: lookupError } = await supabase.from("transactions")
      .select("id, portfolio_id, ticker, action, alert_text").eq("id", transactionId).maybeSingle();
    if (lookupError) throw new Error("Could not load queued transaction");
    if (!transaction) continue;
    const result = await deliverTradeAlert(supabase, transaction);
    retried += 1;
    sent += result.sent;
  }
  return { retried, sent };
}
