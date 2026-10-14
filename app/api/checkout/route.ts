import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { createClient, createWriteClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const CheckoutSchema = z.object({
  profileId: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const limiter = rateLimit(`checkout:${getClientIp(request)}`, { maxRequests: 10 });
    if (!limiter.success) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = CheckoutSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid investor profile is required" }, { status: 400 });
    }
    const { profileId } = parsed.data;

    const profileQuery = supabase
      .from("profiles")
      .select("id, subscription_fee_inr, display_name");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileId);
    const { data: profile } = isUuid
      ? await profileQuery.eq("id", profileId).maybeSingle()
      : await profileQuery.eq("slug", profileId).maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: portfolio } = await supabase
      .from("portfolios")
      .select("is_demo")
      .eq("profile_id", profile.id)
      .eq("name", "Primary")
      .maybeSingle();

    if (!portfolio || portfolio.is_demo) {
      return NextResponse.json(
        { error: "Demo profiles cannot accept payments or subscriptions." },
        { status: 409 }
      );
    }

    const fee = Number(profile.subscription_fee_inr ?? 0);
    const amountInPaise = Math.round(fee * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json({ error: "This profile does not have a subscription fee" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }
    const writeClient = createWriteClient();
    if (!writeClient) return NextResponse.json({ error: "Payment storage is unavailable" }, { status: 503 });
    const { data: entitlement, error: entitlementError } = await supabase.from("subscriptions")
      .select("id").eq("follower_user_id", user.id).eq("profile_id", profile.id)
      .eq("status", "active").limit(1).maybeSingle();
    if (entitlementError) return NextResponse.json({ error: "Could not check payment status" }, { status: 503 });
    if (entitlement) return NextResponse.json({ error: "You already have access. Follow this creator to restore updates." }, { status: 409 });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `fvi_${randomUUID().replaceAll("-", "")}`,
      notes: {
        userId: user.id,
        profileId: profile.id,
      },
    });

    const { error: storageError } = await writeClient.from("checkout_orders").insert({
      razorpay_order_id: order.id, follower_user_id: user.id, profile_id: profile.id,
      amount_paise: amountInPaise, currency: "INR",
    });
    if (storageError) throw new Error(`Could not persist checkout order: ${storageError.message}`);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
