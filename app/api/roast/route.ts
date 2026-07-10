import { calculatePortfolio, generateRoast } from "@/lib/portfolio";
import type { RoastRequest, RoastResult } from "@/lib/roast-types";
import { createWriteClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RoastRequest;
    const computed = await calculatePortfolio(payload.holdings ?? []);
    const roast = await generateRoast(computed);

    const result: RoastResult = {
      ...computed,
      ...roast
    };

    if (payload.email) {
      const supabase = createWriteClient();
      if (supabase) {
        await supabase.from("roast_leads").insert({
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
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something broke while roasting the portfolio."
      },
      { status: 400 }
    );
  }
}
