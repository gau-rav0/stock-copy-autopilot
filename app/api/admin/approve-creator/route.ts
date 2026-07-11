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

    // Verify admin role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { applicationId } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const writeClient = createWriteClient();
    if (!writeClient) {
      return NextResponse.json({ error: "Service role client not configured" }, { status: 500 });
    }

    // 1. Fetch application details
    const { data: application, error: appError } = await writeClient
      .from("creator_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "pending_review") {
      return NextResponse.json({ error: "Application is not pending review" }, { status: 400 });
    }

    // 2. Find the user by email
    const { data: creatorUser, error: userError } = await writeClient
      .from("users")
      .select("id")
      .eq("email", application.email)
      .single();

    if (userError || !creatorUser) {
      return NextResponse.json(
        { error: "Creator user not found. They must sign up first using the email on the application." },
        { status: 404 }
      );
    }

    // 3. Update user role
    const { error: roleError } = await writeClient
      .from("users")
      .update({ role: "creator" })
      .eq("id", creatorUser.id);

    if (roleError) throw new Error("Failed to update user role");

    // 4. Create profile
    const { data: profile, error: profileError } = await writeClient
      .from("profiles")
      .insert({
        user_id: creatorUser.id,
        display_name: application.creator_name || application.email.split("@")[0],
        investing_style: "growth", // default style
        verified: true,
        verification_tier: "cas",
      })
      .select()
      .single();

    if (profileError) throw new Error("Failed to create profile: " + profileError.message);

    // 5. Create portfolio
    const { data: portfolio, error: portfolioError } = await writeClient
      .from("portfolios")
      .insert({
        profile_id: profile.id,
        name: "Primary",
        is_demo: false,
      })
      .select()
      .single();

    if (portfolioError) throw new Error("Failed to create portfolio: " + portfolioError.message);

    // 6. Insert holdings
    const parsedHoldings = application.parsed_holdings || [];
    if (Array.isArray(parsedHoldings) && parsedHoldings.length > 0) {
      const holdingsToInsert = parsedHoldings.map((h: any) => ({
        portfolio_id: portfolio.id,
        ticker: h.symbol || h.name || "UNKNOWN",
        allocation_pct: h.weight_pct || 0,
        current_price: h.market_value ? (h.market_value / (h.quantity || 1)) : null,
      }));

      const { error: holdingsError } = await writeClient
        .from("holdings")
        .insert(holdingsToInsert);

      if (holdingsError) throw new Error("Failed to insert holdings: " + holdingsError.message);
    }

    // 7. Update application status
    const { error: updateAppError } = await writeClient
      .from("creator_applications")
      .update({ status: "approved" })
      .eq("id", applicationId);

    if (updateAppError) throw new Error("Failed to update application status");

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error: any) {
    console.error("Approve creator error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
