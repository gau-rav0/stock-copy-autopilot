import { NextResponse } from "next/server";
import { createClient, createWriteClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ticker, action, alertText, allocationBefore, allocationAfter } = body;

    if (!ticker || !action || !alertText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify creator profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, verified")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile || !profile.verified) {
      return NextResponse.json({ error: "Forbidden: Verified creators only" }, { status: 403 });
    }

    // Get the creator's portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("profile_id", profile.id)
      .limit(1)
      .single();

    if (portfolioError || !portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Insert conviction alert transaction
    const writeClient = createWriteClient();
    if (!writeClient) {
      return NextResponse.json({ error: "Service role client not configured" }, { status: 500 });
    }

    const { data: newAlert, error: insertError } = await writeClient
      .from("transactions")
      .insert({
        portfolio_id: portfolio.id,
        ticker,
        action,
        allocation_before: allocationBefore || 0,
        allocation_after: allocationAfter || 0,
        price: 0,             // Can be fetched from a market API or left 0
        transaction_date: new Date().toISOString().split("T")[0],
        is_conviction_alert: true,
        alert_text: alertText
      })
      .select()
      .single();

    if (insertError) {
      throw new Error("Failed to insert conviction alert: " + insertError.message);
    }

    // Trigger the email blast
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fvi-ochre.vercel.app";
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookSecret) {
        fetch(`${siteUrl}/api/internal/blast-alert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${webhookSecret}`,
          },
          body: JSON.stringify({ record: newAlert }),
        }).catch(err => console.error("Failed to trigger email blast fetch", err));
      } else {
        console.warn("WEBHOOK_SECRET is not set, skipping email blast");
      }
    } catch (e) {
      console.error("Error setting up email blast trigger", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Broadcast alert error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
