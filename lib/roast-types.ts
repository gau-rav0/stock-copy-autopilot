export type HoldingInput = {
  stock_symbol: string;
  qty: number;
  avg_buy_price: number;
  buy_date?: string;
};

export type RoastRequest = {
  displayName?: string;
  email?: string;
  holdings: HoldingInput[];
};

export type HoldingResult = HoldingInput & {
  name: string;
  sector: string;
  current_price: number;
  invested_value: number;
  current_value: number;
  absolute_return_pct: number;
  cagr_pct: number | null;
  holding_months: number | null;
};

export type SectorExposure = {
  sector: string;
  value: number;
  percentage: number;
};

export type RoastResult = {
  score: number;
  risk_score: number;
  diversification_score: number;
  conviction_score: number;
  timing_score: number;
  patience_score: number | null;
  verdict: string;
  roast_lines: string[];
  metrics: {
    current_value: number;
    invested_value: number;
    absolute_return_pct: number;
    cagr_pct: number | null;
    max_drawdown_pct: number;
    concentration_pct: number;
    unique_sectors: number;
    holdings_count: number;
    benchmark_cagr_pct: number | null;
    sector_exposure: SectorExposure[];
  };
  holdings: HoldingResult[];
  generated_by: "deterministic" | "openai";
};
