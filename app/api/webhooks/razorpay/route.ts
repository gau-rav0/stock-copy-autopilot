import { NextResponse } from "next/server";
import crypto from "crypto";
import { createWriteClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payload = event.payload.payment?.entity || event.payload.order?.entity;
      const notes = payload?.notes;

      if (notes && notes.userId && notes.profileId) {
        const supabase = createWriteClient();
        if (supabase) {
          // Insert into subscriptions
          await supabase.from("subscriptions").insert({
            follower_user_id: notes.userId,
            profile_id: notes.profileId,
            amount_inr: (payload.amount ?? 0) / 100, // convert paise to INR
            razorpay_subscription_id: payload.order_id || payload.id,
            status: "active",
          });

          // Insert or update follower
          await supabase.from("followers").upsert(
            {
              follower_user_id: notes.userId,
              profile_id: notes.profileId,
              subscribed: true,
              subscription_id: payload.order_id || payload.id,
            },
            { onConflict: "follower_user_id, profile_id" }
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
