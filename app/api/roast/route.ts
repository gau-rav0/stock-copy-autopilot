import { calculatePortfolio, generateRoast } from "@/lib/portfolio";
import { dispatchOutboundEvent } from "@/lib/outbound";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { RoastResult } from "@/lib/roast-types";
import { createWriteClient } from "@/lib/supabase/server";
import { RoastRequestSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`roast:${ip}`, { maxRequests: 10 });
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = RoastRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const computed = await calculatePortfolio(payload.holdings);
    const roast = await generateRoast(computed);

    const result: RoastResult = {
      ...computed,
      ...roast
    };
    let leadStored = true;

    if (payload.email) {
      const outboundPayload = {
        email: payload.email,
        displayName: payload.displayName || null,
        score: result.score,
        riskScore: result.risk_score,
        holdingsCount: result.metrics.holdings_count,
        investedValue: result.metrics.invested_value,
        currentValue: result.metrics.current_value,
        generatedBy: result.generated_by,
        source: "portfolio_roast",
      };
      const supabase = createWriteClient();
      if (supabase) {
        const { error: roastLeadsError } = await supabase.from("roast_leads").insert({
          email: payload.email,
          display_name: payload.displayName || null,
          score: result.score,
          risk_score: result.risk_score,
          holdings_count: result.metrics.holdings_count,
          invested_value: result.metrics.invested_value,
          current_value: result.metrics.current_value,
          generated_by: result.generated_by,
          source: "portfolio_roast",
        });
        if (roastLeadsError) {
          leadStored = false;
          console.error("Roast lead insert failed", {
            table: "roast_leads",
            code: roastLeadsError.code,
            message: roastLeadsError.message,
          });
        }
        // Also capture in waitlist
        const { error: waitlistSignupsError } = await supabase.from("waitlist_signups").insert({
          email: payload.email,
          source: "roast_page",
        });
        if (waitlistSignupsError) {
          leadStored = false;
          console.error("Roast lead insert failed", {
            table: "waitlist_signups",
            code: waitlistSignupsError.code,
            message: waitlistSignupsError.message,
          });
        }
        const outbound = await dispatchOutboundEvent("roast_lead", outboundPayload);
        await supabase.from("outbound_deliveries").insert([
          { event_type: "roast_lead", destination: "crm", status: outbound.crm, payload: outboundPayload },
          { event_type: "roast_lead", destination: "email", status: outbound.email, payload: outboundPayload },
        ]);
      } else {
        await dispatchOutboundEvent("roast_lead", outboundPayload);
      }
    }

    return NextResponse.json({ ...result, leadStored });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something broke while roasting the portfolio."
      },
      { status: 400 }
    );
  }
}
