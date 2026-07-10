import { NSE_UNIVERSE } from "@/data/nse-universe";
import { PDFParse } from "pdf-parse";

export type ParsedCasHolding = {
  symbol: string | null;
  name: string;
  quantity: number | null;
  marketValue: number | null;
  weightPct: number | null;
  sourceLine: string;
  confidence: "high" | "medium" | "low";
};

export type CasParseResult = {
  holdings: ParsedCasHolding[];
  rawText: string;
  warnings: string[];
};

const knownSymbols = new Set(NSE_UNIVERSE.map((stock) => stock.symbol));
const knownNames = NSE_UNIVERSE.map((stock) => ({
  symbol: stock.symbol,
  normalizedName: stock.name.toUpperCase().replace(/[^A-Z0-9]/g, ""),
}));

const parseNumber = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const clean = value.replace(/[,\s]/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLine = (line: string) =>
  line
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchKnownStock = (line: string) => {
  const compact = line.toUpperCase().replace(/[^A-Z0-9&]/g, "");
  const symbol = [...knownSymbols].find((candidate) => compact.includes(candidate.replace(/[^A-Z0-9&]/g, "")));
  if (symbol) {
    return { symbol, name: NSE_UNIVERSE.find((stock) => stock.symbol === symbol)?.name ?? symbol };
  }

  const nameMatch = knownNames.find((stock) => compact.includes(stock.normalizedName));
  if (!nameMatch) {
    return null;
  }

  return { symbol: nameMatch.symbol, name: NSE_UNIVERSE.find((stock) => stock.symbol === nameMatch.symbol)?.name ?? nameMatch.symbol };
};

const inferName = (line: string, symbol: string | null) => {
  if (symbol) {
    return NSE_UNIVERSE.find((stock) => stock.symbol === symbol)?.name ?? symbol;
  }

  return line
    .replace(/\b\d[\d,]*(?:\.\d+)?%?\b/g, "")
    .replace(/\b(?:ISIN|NSE|BSE|EQUITY|TOTAL|MARKET|VALUE|QTY|QUANTITY)\b/gi, "")
    .replace(/[|,:;-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
};

const shouldSkipLine = (line: string) =>
  line.length < 4 ||
  /^(total|grand total|subtotal|folio|statement|date|isin|scheme|mutual fund|demat|account)\b/i.test(line);

export function parseCasText(rawText: string): CasParseResult {
  const warnings: string[] = [];
  const dedupe = new Set<string>();
  const holdings: ParsedCasHolding[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = normalizeLine(rawLine);
    if (shouldSkipLine(line)) {
      continue;
    }

    const stock = matchKnownStock(line);
    const percentMatch = line.match(/(-?\d+(?:\.\d+)?)\s*%/);
    const currencyMatches = [...line.matchAll(/(?:INR|Rs\.?|₹)?\s*(-?\d[\d,]*(?:\.\d{1,2})?)/gi)].map((match) => match[1]);
    const values = currencyMatches.map(parseNumber).filter((value): value is number => value !== null);

    if (!stock && values.length < 2 && !percentMatch) {
      continue;
    }

    const weightPct = parseNumber(percentMatch?.[1]);
    const marketValue = values.length > 0 ? Math.max(...values) : null;
    const quantityCandidates = values.filter((value) => value > 0 && value !== marketValue);
    const quantity = quantityCandidates.length > 0 ? quantityCandidates[0] : null;
    const name = inferName(line, stock?.symbol ?? null);
    const confidence = stock && (marketValue || weightPct) ? "high" : stock || marketValue ? "medium" : "low";
    const key = `${stock?.symbol ?? name}:${marketValue ?? ""}:${weightPct ?? ""}`;

    if (!name || dedupe.has(key)) {
      continue;
    }

    dedupe.add(key);
    holdings.push({
      symbol: stock?.symbol ?? null,
      name,
      quantity,
      marketValue,
      weightPct,
      sourceLine: line,
      confidence,
    });
  }

  if (holdings.length === 0 && rawText.trim()) {
    warnings.push("No recognizable equity holding rows were found. Keep this application in manual review.");
  }

  return {
    holdings: holdings.slice(0, 50),
    rawText,
    warnings,
  };
}

export async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
