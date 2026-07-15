import { NSE_UNIVERSE, STOCK_LOOKUP } from "@/data/nse-universe";
import { getBenchmarkHistory, getMarketSnapshot } from "@/lib/market-data";
import type { HoldingInput, HoldingResult, RoastResult, SectorExposure } from "@/lib/roast-types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const pct = (value: number) => Number(value.toFixed(2));

const monthsBetween = (from: Date, to: Date) =>
  Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth());

const parseBuyDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}-01T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const maxDrawdown = (values: number[]) => {
  let peak = values[0] ?? 0;
  let worst = 0;

  values.forEach((value) => {
    peak = Math.max(peak, value);
    if (peak > 0) {
      worst = Math.min(worst, (value - peak) / peak);
    }
  });

  return Math.abs(worst) * 100;
};

const cagr = (start: number, end: number, months: number) => {
  if (start <= 0 || end <= 0 || months < 2) {
    return null;
  }

  const years = months / 12;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
};

const calculateBenchmarkCagr = (history: number[], averageMonths: number | null) => {
  if (!averageMonths || history.length < 2) {
    return null;
  }

  const months = Math.min(Math.max(averageMonths, 2), history.length - 1);
  const start = history[Math.max(0, history.length - 1 - months)];
  const end = history.at(-1);

  if (!start || !end) {
    return null;
  }

  return cagr(start, end, months);
};

export const normaliseHoldings = (holdings: HoldingInput[]) =>
  holdings
    .slice(0, 10)
    .map((holding) => ({
      stock_symbol: holding.stock_symbol.toUpperCase().trim(),
      qty: Number(holding.qty),
      avg_buy_price: Number(holding.avg_buy_price),
      buy_date: holding.buy_date || undefined
    }))
    .filter((holding) => holding.stock_symbol && holding.qty > 0 && holding.avg_buy_price > 0);

const sectorExposure = (holdings: HoldingResult[], totalValue: number): SectorExposure[] => {
  const bySector = new Map<string, number>();

  holdings.forEach((holding) => {
    bySector.set(holding.sector, (bySector.get(holding.sector) ?? 0) + holding.current_value);
  });

  return [...bySector.entries()]
    .map(([sector, value]) => ({
      sector,
      value: pct(value),
      percentage: totalValue > 0 ? pct((value / totalValue) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value);
};

const deterministicRoast = (result: Omit<RoastResult, "verdict" | "roast_lines" | "generated_by">) => {
  const { metrics, score, risk_score, diversification_score, timing_score, conviction_score } = result;
  const topSector = metrics.sector_exposure[0];
  const underBenchmark =
    metrics.cagr_pct !== null && metrics.benchmark_cagr_pct !== null && metrics.cagr_pct < metrics.benchmark_cagr_pct;

  const verdict =
    score >= 78
      ? "Suspiciously competent. Are you sure this was retail investing?"
      : score >= 60
        ? "Playable portfolio, but the confidence is doing cardio the returns did not sign up for."
        : score >= 42
          ? "This is not a portfolio. This is a group chat argument with ISINs."
          : "Your holdings look like they were assembled during a market-hours power cut.";

  const lines: string[] = [];

  if (metrics.concentration_pct > 45) {
    lines.push(`One stock is ${metrics.concentration_pct.toFixed(0)}% of the portfolio. That's not conviction, that's emotional hostage-taking.`);
  } else if (diversification_score < 45) {
    lines.push(`You bought ${metrics.holdings_count} names and still found only ${metrics.unique_sectors} real ideas. Fake diversification, premium edition.`);
  } else {
    lines.push(`Diversification exists here, which is rude because now the losses have to coordinate schedules.`);
  }

  if (risk_score > 70) {
    lines.push(`Risk score at ${risk_score}/100. The portfolio has more drama than a WhatsApp options group.`);
  } else if (metrics.max_drawdown_pct > 18) {
    lines.push(`A ${metrics.max_drawdown_pct.toFixed(0)}% weighted drawdown. Your patience wasn't tested, it was subpoenaed.`);
  } else {
    lines.push(`Drawdown is under control, so at least the spreadsheet is not actively smoking.`);
  }

  if (underBenchmark) {
    lines.push(`Nifty did better over the comparable period. You created an index fund with extra steps and worse sleep.`);
  } else if (timing_score < 45) {
    lines.push(`Entry timing score: ${timing_score}/100. Confidence of Buffett. Track record of a coin flip.`);
  } else if (conviction_score < 45) {
    lines.push(`Position sizing says you wanted alpha but packed lunch for beta.`);
  } else if (topSector) {
    lines.push(`${topSector.percentage.toFixed(0)}% in ${topSector.sector}. Sector thesis or just muscle memory with a brokerage login?`);
  }

  return {
    verdict,
    roast_lines: lines.slice(0, 3)
  };
};

export const calculatePortfolio = async (holdingsInput: HoldingInput[]): Promise<Omit<RoastResult, "verdict" | "roast_lines" | "generated_by">> => {
  const clean = normaliseHoldings(holdingsInput);

  if (clean.length === 0) {
    throw new Error("Add at least one valid holding.");
  }

  const unknownSymbols = [...new Set(clean.map((h) => h.stock_symbol).filter((s) => !STOCK_LOOKUP.has(s)))];
  if (unknownSymbols.length > 0) {
    throw new Error(
      `We don't recognise ${unknownSymbols.join(", ")}. Enter a valid NSE symbol (e.g. RELIANCE, INFY, HDFCBANK) so the roast is based on real holdings, not guesses.`
    );
  }

  const now = new Date();
  const snapshots = await Promise.all(clean.map((holding) => getMarketSnapshot(holding.stock_symbol)));
  const historiesBySymbol = new Map(snapshots.map((snapshot) => [snapshot.symbol, snapshot.history]));

  const holdings: HoldingResult[] = clean.map((holding, index) => {
    const meta = STOCK_LOOKUP.get(holding.stock_symbol) ?? NSE_UNIVERSE[0];
    const snapshot = snapshots[index];
    const buyDate = parseBuyDate(holding.buy_date);
    const holdingMonths = buyDate ? monthsBetween(buyDate, now) : null;
    const currentValue = holding.qty * snapshot.price;
    const investedValue = holding.qty * holding.avg_buy_price;
    const holdingCagr = holdingMonths ? cagr(holding.avg_buy_price, snapshot.price, holdingMonths) : null;

    return {
      ...holding,
      name: meta?.name ?? holding.stock_symbol,
      sector: meta?.sector ?? "Unknown",
      current_price: pct(snapshot.price),
      invested_value: pct(investedValue),
      current_value: pct(currentValue),
      absolute_return_pct: pct(((currentValue - investedValue) / investedValue) * 100),
      cagr_pct: holdingCagr === null ? null : pct(holdingCagr),
      holding_months: holdingMonths
    };
  });

  const currentValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0);
  const investedValue = holdings.reduce((sum, holding) => sum + holding.invested_value, 0);
  const absoluteReturn = investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0;
  const cagrInputs = holdings.filter((holding) => holding.cagr_pct !== null);
  const weightedCagr =
    cagrInputs.length > 0 && currentValue > 0
      ? cagrInputs.reduce((sum, holding) => sum + (holding.cagr_pct ?? 0) * (holding.current_value / currentValue), 0)
      : null;

  const weightedDrawdown = holdings.reduce((sum, holding) => {
    const history = historiesBySymbol.get(holding.stock_symbol) ?? [];
    const weight = currentValue > 0 ? holding.current_value / currentValue : 0;
    return sum + maxDrawdown(history) * weight;
  }, 0);

  const largestHolding = holdings.reduce((largest, holding) => Math.max(largest, holding.current_value), 0);
  const concentration = currentValue > 0 ? (largestHolding / currentValue) * 100 : 0;
  const exposures = sectorExposure(holdings, currentValue);
  const uniqueSectors = exposures.length;
  const avgMonths =
    cagrInputs.length > 0
      ? Math.round(cagrInputs.reduce((sum, holding) => sum + (holding.holding_months ?? 0), 0) / cagrInputs.length)
      : null;
  const benchmarkCagr = calculateBenchmarkCagr(await getBenchmarkHistory(), avgMonths);

  const diversificationScore = clamp(uniqueSectors * 18 + clean.length * 4 - concentration * 0.8);
  const riskScore = clamp(concentration * 1.1 + weightedDrawdown * 1.7 + (uniqueSectors <= 2 ? 18 : 0));
  const convictionScore = clamp(82 - Math.abs(holdings.length - 6) * 7 - (concentration > 55 ? 22 : 0));
  const timingScore = clamp(50 + absoluteReturn * 0.65 - weightedDrawdown * 0.45);
  const patienceScore = avgMonths === null ? null : clamp(28 + avgMonths * 2.7);
  const portfolioScore = clamp(
    44 +
      absoluteReturn * 0.35 +
      diversificationScore * 0.2 +
      convictionScore * 0.14 +
      timingScore * 0.18 -
      riskScore * 0.18 +
      (patienceScore ?? 52) * 0.08
  );

  return {
    score: Math.round(portfolioScore),
    risk_score: Math.round(riskScore),
    diversification_score: Math.round(diversificationScore),
    conviction_score: Math.round(convictionScore),
    timing_score: Math.round(timingScore),
    patience_score: patienceScore === null ? null : Math.round(patienceScore),
    metrics: {
      current_value: pct(currentValue),
      invested_value: pct(investedValue),
      absolute_return_pct: pct(absoluteReturn),
      cagr_pct: weightedCagr === null ? null : pct(weightedCagr),
      max_drawdown_pct: pct(weightedDrawdown),
      concentration_pct: pct(concentration),
      unique_sectors: uniqueSectors,
      holdings_count: holdings.length,
      benchmark_cagr_pct: benchmarkCagr === null ? null : pct(benchmarkCagr),
      sector_exposure: exposures
    },
    holdings
  };
};

const stripJsonFences = (value: string) => value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

export const generateRoast = async (
  computed: Omit<RoastResult, "verdict" | "roast_lines" | "generated_by">
): Promise<Pick<RoastResult, "verdict" | "roast_lines" | "generated_by">> => {
  const apiKey = process.env.KMICHI_API_KEY ?? process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
  const model = process.env.KMICHI_MODEL ?? process.env.AI_MODEL ?? process.env.OPENAI_MODEL;
  const baseUrl =
    process.env.KMICHI_API_KEY && !process.env.AI_API_BASE_URL && !process.env.OPENAI_BASE_URL
      ? "https://llm.kimchi.dev/openai/v1"
      : (process.env.AI_API_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");

  if (!apiKey || !model) {
    return {
      ...deterministicRoast(computed),
      generated_by: "deterministic"
    };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You write savage but not cruel portfolio roasts for anonymous Indian retail investors. No personal attacks, no financial advice, no markdown. Return only valid JSON."
          },
          {
            role: "user",
            content: `Metrics: ${JSON.stringify({
              score: computed.score,
              risk_score: computed.risk_score,
              diversification_score: computed.diversification_score,
              conviction_score: computed.conviction_score,
              timing_score: computed.timing_score,
              patience_score: computed.patience_score,
              metrics: computed.metrics
            })}. Tone examples: "Confidence of Buffett. Track record of a coin flip." "This is not diversification, this is buying the whole group chat."`
          }
        ],
        temperature: 0.9,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI roast failed: ${response.status}`);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const outputText = json.choices?.[0]?.message?.content;

    if (!outputText) {
      throw new Error("OpenAI response did not include text.");
    }

    const parsed = JSON.parse(stripJsonFences(outputText)) as { verdict: string; roast_lines: string[] };

    return {
      verdict: parsed.verdict,
      roast_lines: parsed.roast_lines.slice(0, 3),
      generated_by: "openai"
    };
  } catch {
    return {
      ...deterministicRoast(computed),
      generated_by: "deterministic"
    };
  }
};
