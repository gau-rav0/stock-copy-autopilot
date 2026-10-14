import { verifyWebhookSignature } from "@/lib/webhook-signature";
import { NextResponse, after } from "next/server";
import { z } from "zod";
import { deliverTradeAlert } from "@/lib/trade-alert-delivery";
export const maxDuration = 60;
import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";

const TradeWebhookSchema = z.object({
  creatorUserId: z.string().uuid(),
  broker: z.enum(["zerodha", "upstox", "angelone", "groww", "other"]),
  externalTradeId: z.string().trim().min(1).max(200),
  ticker: z.string().trim().toUpperCase().regex(/^[A-Z0-9&-]{1,30}$/),
  action: z.enum(["buy", "add", "reduce", "exit"]),
  price: z.number().nonnegative().optional(),
  allocationBefore: z.number().min(0).max(100).optional().default(0),
  allocationAfter: z.number().min(0).max(100).optional().default(0),
  occurredAt: z.string().datetime(),
});

export async function POST(request: Request) {
  const secret = process.env.BROKER_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Broker webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-fvi-signature"), secret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const parsed = TradeWebhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  }

  const trade = parsed.data;
  if (!hasSupabaseWriteConfig()) {
    return NextResponse.json({ error: "Supabase service-role access is not configured" }, { status: 503 });
  }
  const supabase = createWriteClient();
  if (!supabase) return NextResponse.json({ error: "Supabase write access is not configured" }, { status: 503 });

  const { data: resultRows, error: ingestError } = await supabase.rpc("ingest_broker_trade_event", {
    p_creator_user_id: trade.creatorUserId,
    p_broker: trade.broker,
    p_external_trade_id: trade.externalTradeId,
    p_ticker: trade.ticker,
    p_action: trade.action,
    p_price: trade.price ?? null,
    p_allocation_before: trade.allocationBefore,
    p_allocation_after: trade.allocationAfter,
    p_occurred_at: trade.occurredAt,
  });
  if (ingestError) return NextResponse.json({ error: "Trade event could not be accepted" }, { status: 409 });

  const result = resultRows?.[0];
  if (!result) return NextResponse.json({ error: "Trade event could not be recorded" }, { status: 500 });
  if (result.duplicate) return NextResponse.json({ accepted: true, duplicate: true, eventId: result.event_id });

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select()
    .eq("id", result.transaction_id)
    .single();
  if (transactionError || !transaction) return NextResponse.json({ error: "Trade event was recorded but could not be delivered" }, { status: 500 });

  after(async () => {
    try { await deliverTradeAlert(supabase, transaction); }
    catch (error) { console.error("Broker delivery deferred to retry queue", error); }
  });
  return NextResponse.json({ accepted: true, eventId: result.event_id, transactionId: result.transaction_id }, { status: 201 });
}
