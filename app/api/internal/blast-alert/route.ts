import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Verify the request securely
    const authHeader = req.headers.get("Authorization");
    const secretKey = process.env.WEBHOOK_SECRET;

    if (authHeader !== `Bearer ${secretKey}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse the payload from pg_net
    const payload = await req.json();
    const transaction = payload.record || payload; // Depending on how pg_net shapes it, it's usually just the NEW row

    if (!transaction.is_conviction_alert) {
      return NextResponse.json({ message: "Not a conviction alert, ignoring." });
    }

    // 3. Fetch portfolio & profile info
    const { data: portfolio, error: portfolioError } = await supabaseAdmin
      .from("portfolios")
      .select("profile_id, profiles!inner(display_name)")
      .eq("id", transaction.portfolio_id)
      .single();

    if (portfolioError || !portfolio) {
      console.error("Error fetching portfolio:", portfolioError);
      return new NextResponse("Portfolio not found", { status: 404 });
    }

    const profileId = portfolio.profile_id;
    // @ts-ignore - profiles is a joined relation
    const creatorName = portfolio.profiles?.display_name || "A creator you follow";

    // 4. Fetch followers and their emails
    const { data: followers, error: followersError } = await supabaseAdmin
      .from("followers")
      .select("follower_user_id, users!inner(email)")
      .eq("profile_id", profileId);

    if (followersError || !followers || followers.length === 0) {
      console.warn("No followers found or error:", followersError);
      return NextResponse.json({ message: "No followers to notify" });
    }

    // Extract emails
    // @ts-ignore - users is a joined relation
    // No preference row means the follower keeps the product default: trade alerts enabled.
    // Explicit opt-outs are removed before any recipient list is handed to the email provider.
    const followerIds = followers.map((f: any) => f.follower_user_id).filter(Boolean);
    const { data: preferences, error: preferencesError } = followerIds.length
      ? await supabaseAdmin
          .from("notification_preferences")
          .select("user_id, trade_alerts_email")
          .in("user_id", followerIds)
      : { data: [], error: null };

    if (preferencesError) {
      console.error("Error fetching notification preferences:", preferencesError);
      return new NextResponse("Unable to load notification preferences", { status: 500 });
    }

    const optedOut = new Set(
      (preferences ?? [])
        .filter((preference) => preference.trade_alerts_email === false)
        .map((preference) => preference.user_id)
    );
    const optedInEmails = followers
      .filter((f: any) => !optedOut.has(f.follower_user_id))
      .map((f: any) => f.users?.email)
      .filter(Boolean) as string[];

    if (optedInEmails.length === 0) {
      return NextResponse.json({ message: "No valid emails found among followers" });
    }

    // 5. Build and send the email using Resend
    // Resend free tier has limitations, but we can send to max 50 emails per API call using batching or bcc.
    // We will use bcc for simplicity in this epic.

    const actionText = transaction.action.toUpperCase();
    const ticker = transaction.ticker;
    const alertText = transaction.alert_text || "No additional explanation provided.";
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #009d55; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">🚨 New Conviction Alert</h2>
        </div>
        <div style="padding: 24px; color: #333;">
          <p style="font-size: 16px;"><strong>${creatorName}</strong> just posted a new conviction alert!</p>
          
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 18px;">
              <strong>Action:</strong> <span style="color: ${transaction.action === 'buy' || transaction.action === 'add' ? '#009d55' : '#ff5a66'}">${actionText}</span>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 18px;">
              <strong>Ticker:</strong> ${ticker}
            </p>
            <p style="margin: 0; font-size: 16px;">
              <strong>Note:</strong> ${alertText}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            You are receiving this because you follow ${creatorName} on Follow Verified Investors.
          </p>
        </div>
      </div>
    `;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Alerts <alerts@followverified.com>", // You must verify this domain in Resend
      to: optedInEmails[0], // First recipient in 'to'
      bcc: optedInEmails.slice(1), // Rest in 'bcc'
      subject: `🚨 ${creatorName} Alert: ${actionText} ${ticker}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return new NextResponse("Failed to send emails", { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Alert sent to ${optedInEmails.length} followers`, data: emailData });
    
  } catch (error: any) {
    console.error("Blast alert error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
