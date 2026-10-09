import { NextResponse } from "next/server";
import { z } from "zod";
import { createWriteClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/webhook-signature";

const NotesSchema = z.object({ userId: z.string().uuid(), profileId: z.string().uuid() });
const PaymentSchema = z.object({
  order_id: z.string().min(1), amount: z.number().int().positive(), currency: z.literal("INR"),
  status: z.literal("captured"), notes: NotesSchema,
});
const OrderSchema = z.object({
  id: z.string().min(1), amount: z.number().int().positive(), currency: z.literal("INR"),
  status: z.literal("paid"), notes: NotesSchema,
});

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let event;
  try { event = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!event || typeof event !== "object") return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  if (!["payment.captured", "order.paid"].includes(event.event)) return NextResponse.json({ received: true });
  const parsed = event.event === "payment.captured"
    ? PaymentSchema.safeParse(event.payload?.payment?.entity)
    : OrderSchema.safeParse(event.payload?.order?.entity);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment metadata" }, { status: 400 });
  const entity = parsed.data;
  const orderId = "order_id" in entity ? entity.order_id : entity.id;
  const supabase = createWriteClient();
  if (!supabase) return NextResponse.json({ error: "Webhook storage is unavailable" }, { status: 503 });
  try {
    const { error } = await supabase.rpc("activate_checkout_order", {
      p_order_id: orderId, p_user_id: entity.notes.userId, p_profile_id: entity.notes.profileId,
      p_amount_paise: entity.amount, p_currency: entity.currency,
    });
    if (error) throw new Error(`Payment activation failed: ${error.message}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
