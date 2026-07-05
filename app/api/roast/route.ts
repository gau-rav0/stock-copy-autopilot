import { calculatePortfolio, generateRoast } from "@/lib/portfolio";
import type { RoastRequest, RoastResult } from "@/lib/roast-types";
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
