import { STOCK_LOOKUP } from "@/data/nse-universe";

export type ImportedHolding = {
  symbol: string;
  quantity: number;
  averagePrice: number | null;
};

export type PortfolioImportResult = {
  holdings: ImportedHolding[];
  errors: string[];
  duplicates: string[];
  missingSymbols: string[];
  totalRows: number;
};

const SYMBOL_HEADERS = ["symbol", "ticker", "stock symbol", "security", "security symbol"];
const QUANTITY_HEADERS = ["quantity", "qty", "quantity held", "units", "shares"];
const PRICE_HEADERS = ["average price", "avg price", "avg buy price", "average buy price", "buy price"];

const normaliseHeader = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += char;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function findColumn(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(header));
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePortfolioCsv(text: string): PortfolioImportResult {
  const rows = readCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    return { holdings: [], errors: ["Add a header row and at least one holding."], duplicates: [], missingSymbols: [], totalRows: 0 };
  }

  const headers = rows[0].map(normaliseHeader);
  const symbolColumn = findColumn(headers, SYMBOL_HEADERS);
  const quantityColumn = findColumn(headers, QUANTITY_HEADERS);
  const priceColumn = findColumn(headers, PRICE_HEADERS);
  const errors: string[] = [];
  if (symbolColumn < 0) errors.push("We could not find a Symbol or Ticker column.");
  if (quantityColumn < 0) errors.push("We could not find a Quantity or Qty column.");
  if (errors.length) return { holdings: [], errors, duplicates: [], missingSymbols: [], totalRows: rows.length - 1 };

  const bySymbol = new Map<string, ImportedHolding>();
  const duplicates = new Set<string>();
  const missingSymbols = new Set<string>();
  const dataRows = rows.slice(1, 501);
  if (rows.length > 501) errors.push("Only the first 500 rows were processed.");

  dataRows.forEach((row, index) => {
    const symbol = (row[symbolColumn] ?? "").trim().toUpperCase().replace(/\.NS$/, "");
    const quantity = parseNumber(row[quantityColumn]);
    const averagePrice = priceColumn < 0 ? null : parseNumber(row[priceColumn]);
    if (!symbol || !quantity || quantity <= 0) {
      errors.push(`Row ${index + 2}: a valid symbol and positive quantity are required.`);
      return;
    }
    if (!/^[A-Z0-9&-]{1,30}$/.test(symbol)) {
      errors.push(`Row ${index + 2}: ${symbol} is not a valid NSE symbol format.`);
      return;
    }
    if (!STOCK_LOOKUP.has(symbol)) missingSymbols.add(symbol);
    const existing = bySymbol.get(symbol);
    if (!existing) {
      bySymbol.set(symbol, { symbol, quantity, averagePrice: averagePrice && averagePrice > 0 ? averagePrice : null });
      return;
    }
    duplicates.add(symbol);
    const existingValue = existing.averagePrice ? existing.quantity * existing.averagePrice : 0;
    const incomingValue = averagePrice && averagePrice > 0 ? quantity * averagePrice : 0;
    const totalQuantity = existing.quantity + quantity;
    bySymbol.set(symbol, {
      symbol,
      quantity: totalQuantity,
      averagePrice: existingValue + incomingValue > 0 ? Number(((existingValue + incomingValue) / totalQuantity).toFixed(4)) : null,
    });
  });

  return {
    holdings: [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    errors: errors.slice(0, 25),
    duplicates: [...duplicates].sort(),
    missingSymbols: [...missingSymbols].sort(),
    totalRows: dataRows.length,
  };
}
