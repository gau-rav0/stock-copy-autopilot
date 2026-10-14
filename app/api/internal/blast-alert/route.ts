import { NextResponse, after } from "next/server";
import { createWriteClient } from "@/lib/supabase/server";
import { deliverTradeAlert } from "@/lib/trade-alert-delivery";
import { secureStringEquals } from "@/lib/secure-compare";
import { z } from "zod";

const AlertSchema = z.object({ id: z.string().uuid() });
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.WEBHOOK_SECRET) return new NextResponse("Webhook not configured", { status: 503 });
  if (!secureStringEquals(request.headers.get("authorization"), `Bearer ${process.env.WEBHOOK_SECRET}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const supabase = createWriteClient();
  if (!supabase) return new NextResponse("Storage not configured", { status: 503 });
  const payload = await request.json().catch(() => null);
  const parsed = AlertSchema.safeParse(payload?.record ?? payload);
  if (!parsed.success) return new NextResponse("A valid transaction ID is required", { status: 400 });
  const { data: transaction, error } = await supabase.from("transactions")
    .select("id, portfolio_id, ticker, action, alert_text, is_conviction_alert").eq("id", parsed.data.id).maybeSingle();
  if (error) return new NextResponse("Could not load alert", { status: 503 });
  if (!transaction) return new NextResponse("Alert not found", { status: 404 });
  if (!transaction.is_conviction_alert) return NextResponse.json({ message: "Not a conviction alert" });
  after(async () => {
    try { await deliverTradeAlert(supabase, transaction); }
    catch (error) { console.error("Alert delivery deferred to retry queue", error); }
  });
  return NextResponse.json({ accepted: true }, { status: 202 });
}
