import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CheckoutSchema = z.object({
  profileId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, subscription_fee_inr, display_name")
      .eq("id", profileId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const fee = profile.subscription_fee_inr || 0;
    if (fee <= 0) {
      return NextResponse.json({ error: "This profile does not have a subscription fee" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountInPaise = Math.round(fee * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `fvi_${randomUUID().replaceAll("-", "")}`,
      notes: {
        userId: user.id,
        profileId: profile.id,
      },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
