import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { ticker, action, alertText } = body;

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
    const { error: insertError } = await supabase
      .from("transactions")
      .insert({
        portfolio_id: portfolio.id,
        ticker,
        action,
        allocation_before: 0, // In a real system, you'd calculate this based on current holdings
        allocation_after: 0,  // Or allow the user to input the new allocation
        price: 0,             // Can be fetched from a market API or left 0
        transaction_date: new Date().toISOString().split("T")[0],
        is_conviction_alert: true,
        alert_text: alertText
      });

    if (insertError) {
      throw new Error("Failed to insert conviction alert: " + insertError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Broadcast alert error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
