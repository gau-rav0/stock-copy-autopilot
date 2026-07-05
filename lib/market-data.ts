import { STOCK_LOOKUP } from "@/data/nse-universe";

export type MarketSnapshot = {
  symbol: string;
  price: number;
  history: number[];
  source: "yahoo" | "fallback";
};

const YAHOO_TIMEOUT_MS = 3200;

const fallbackFor = (symbol: string): MarketSnapshot => {
  const meta = STOCK_LOOKUP.get(symbol);
  return {
    symbol,
    price: meta?.fallbackPrice ?? 100,
    history: meta?.fallbackHistory ?? Array.from({ length: 36 }, (_, index) => 100 + index * 0.4),
    source: "fallback"
  };
};

const withTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), YAHOO_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
      headers: {
        "user-agent": "portfolio-roast-mvp/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Market request failed: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  } finally {
    clearTimeout(timeout);
  }
};

export const getMarketSnapshot = async (rawSymbol: string): Promise<MarketSnapshot> => {
  const symbol = rawSymbol.toUpperCase().trim();
  const yahooSymbol = `${encodeURIComponent(symbol)}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=1y&interval=1d`;

  try {
    const json = await withTimeout(url);
    const result = (json as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; previousClose?: number };
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    }).chart?.result?.[0];

    const closes = result?.indicators?.quote?.[0]?.close?.filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value)
    );
    const price = result?.meta?.regularMarketPrice ?? result?.meta?.previousClose ?? closes?.at(-1);

    if (!price || !closes || closes.length < 15) {
      throw new Error("Incomplete Yahoo chart payload");
    }

    return {
      symbol,
      price: Number(price.toFixed(2)),
      history: closes.slice(-252).map((value) => Number(value.toFixed(2))),
      source: "yahoo"
    };
  } catch {
    return fallbackFor(symbol);
  }
};

export const getBenchmarkHistory = async () => {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=5y&interval=1mo";

  try {
    const json = await withTimeout(url);
    const closes = (json as {
      chart?: { result?: Array<{ indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> };
    }).chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value)
    );

    if (!closes || closes.length < 12) {
      throw new Error("Missing benchmark closes");
    }

    return closes;
  } catch {
    return [18105, 18420, 17810, 18970, 19540, 19850, 20260, 21460, 22120, 22640, 23350, 24110, 23580, 24720, 25240, 25960];
  }
};
