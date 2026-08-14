import { NextResponse } from "next/server";
import { createClient, createWriteClient } from "@/lib/supabase/server";
import { STOCK_LOOKUP } from "@/data/nse-universe";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const BroadcastAlertSchema = z.object({
  ticker: z.string().trim().toUpperCase().min(1).max(20).refine((ticker) => STOCK_LOOKUP.has(ticker), "Enter a recognised NSE symbol."),
  action: z.enum(["buy", "add", "reduce", "exit"]),
  alertText: z.string().trim().min(1).max(500),
  allocationBefore: z.coerce.number().min(0).max(100).optional().default(0),
  allocationAfter: z.coerce.number().min(0).max(100).optional().default(0),
});

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

    const parsed = BroadcastAlertSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
    const { ticker, action, alertText, allocationBefore, allocationAfter } = parsed.data;

    const limiter = rateLimit(`broadcast:${user.id}`, { maxRequests: 5, windowMs: 3_600_000 });
    if (!limiter.success) return NextResponse.json({ error: "Too many broadcast alerts. Try again later." }, { status: 429 });

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
        allocation_before: allocationBefore,
        allocation_after: allocationAfter,
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
