import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deliverTradeAlert } from "@/lib/trade-alert-delivery";
import { secureStringEquals } from "@/lib/secure-compare";

// Resend is initialised lazily inside the handler so we can return a proper error
// if RESEND_API_KEY is missing rather than silently failing with a "dummy" key.

export async function POST(req: Request) {
  // Ensure we have the service role key to bypass RLS and fetch users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  try {
    // 0. Guard: ensure required env vars are present
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set — cannot send emails.");
      return new NextResponse("Email service not configured", { status: 500 });
    }
    if (!process.env.WEBHOOK_SECRET) {
      console.error("WEBHOOK_SECRET is not set — refusing all blast-alert requests.");
      return new NextResponse("Webhook secret not configured", { status: 500 });
    }

    // 1. Verify the request securely
    const authHeader = req.headers.get("Authorization");
    const secretKey = process.env.WEBHOOK_SECRET;

    if (!secureStringEquals(authHeader, `Bearer ${secretKey}`)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse the payload from pg_net
    const payload = await req.json();
    const transaction = payload.record || payload; // Depending on how pg_net shapes it, it's usually just the NEW row

    if (!transaction.is_conviction_alert) {
      return NextResponse.json({ message: "Not a conviction alert, ignoring." });
    }

    const result = await deliverTradeAlert(supabaseAdmin, transaction);
    return NextResponse.json({ success: result.failed === 0, ...result });
    
  } catch (error: any) {
    console.error("Blast alert error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
