import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";

const PaymentNotesSchema = z.object({
  userId: z.string().uuid(),
  profileId: z.string().uuid(),
});

type RazorpayEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  notes?: unknown;
};

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
  };
};

function signatureMatches(payload: string, supplied: string | null, secret: string) {
  if (!supplied) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("hex"), "hex");
  const received = Buffer.from(supplied.trim(), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signatureMatches(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as RazorpayWebhook;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (!hasSupabaseWriteConfig()) {
        return NextResponse.json({ error: "Webhook storage is not configured" }, { status: 503 });
      }

      const payment = event.payload?.payment?.entity;
      const order = event.payload?.order?.entity;
      const notesResult = PaymentNotesSchema.safeParse(payment?.notes ?? order?.notes);
      const razorpayId = payment?.order_id ?? order?.id ?? payment?.id;

      if (!notesResult.success || !razorpayId) {
        throw new Error("Payment webhook is missing a valid order reference or follow metadata");
      }

      const supabase = createWriteClient();
      if (!supabase) {
        return NextResponse.json({ error: "Webhook storage is not configured" }, { status: 503 });
      }

      const { data: portfolio } = await supabase
        .from("portfolios")
        .select("is_demo")
        .eq("profile_id", notesResult.data.profileId)
        .eq("name", "Primary")
        .maybeSingle();
      if (!portfolio || portfolio.is_demo) {
        throw new Error("Payment metadata references a demo or unpublished profile");
      }

      const { data: existingSubscription, error: lookupError } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("razorpay_subscription_id", razorpayId)
        .maybeSingle();
      if (lookupError) throw new Error(`Subscription lookup failed: ${lookupError.message}`);

      if (!existingSubscription) {
        const { error: subscriptionError } = await supabase.from("subscriptions").insert({
          follower_user_id: notesResult.data.userId,
          profile_id: notesResult.data.profileId,
          amount_inr: (payment?.amount ?? order?.amount ?? 0) / 100,
          razorpay_subscription_id: razorpayId,
          status: "active",
        });

        // Another webhook delivery can win the race after the lookup.
        if (subscriptionError && subscriptionError.code !== "23505") {
          throw new Error(`Subscription write failed: ${subscriptionError.message}`);
        }
      }

      const { error: followError } = await supabase.from("followers").upsert(
        {
          follower_user_id: notesResult.data.userId,
          profile_id: notesResult.data.profileId,
          subscribed: true,
          subscription_id: razorpayId,
        },
        { onConflict: "follower_user_id,profile_id" }
      );
      if (followError) {
        throw new Error(`Follow activation failed: ${followError.message}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
