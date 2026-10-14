import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";
import { safeAuthRedirect } from "../lib/auth-redirect";
import { verifyWebhookSignature } from "../lib/webhook-signature";
import { rateLimit } from "../lib/rate-limit";
import { parsePortfolioCsv } from "../lib/portfolio-import";
import { getMarketSnapshot } from "../lib/market-data";
import { CreatorApplicationSchema } from "../lib/validation";
import { normaliseHoldings } from "../lib/portfolio";

test("auth redirects keep local routes and reject external and backslash URLs", () => {
  for (const value of [null, "https://evil.test", "//evil.test", "/\\evil.test", "/\t/evil.test", "javascript:alert(1)"]) {
    assert.equal(safeAuthRedirect(value), "/explore");
  }
  assert.equal(safeAuthRedirect("/investor/alice?view=replay#history"), "/investor/alice?view=replay#history");
  assert.equal(safeAuthRedirect("/%2Fevil.test"), "/%2Fevil.test");
  assert.equal(safeAuthRedirect("/explore?filter=100%"), "/explore?filter=100%");
});

test("webhook signatures reject malformed hex, appended bytes and changed payloads", () => {
  const signature = createHmac("sha256", "secret").update("{}").digest("hex");
  assert.equal(verifyWebhookSignature("{}", signature, "secret"), true);
  for (const bad of [null, signature + "zz", signature.slice(2), "0".repeat(64)]) {
    assert.equal(verifyWebhookSignature("{}", bad, "secret"), false);
  }
  assert.equal(verifyWebhookSignature('{"changed":true}', signature, "secret"), false);
});

test("creator emails are normalised before duplicate checks", () => {
  const parsed = CreatorApplicationSchema.parse({ email: " Alice@Example.com ", method: "manual" });
  assert.equal(parsed.email, "alice@example.com");
});

test("CSV duplicate lots retain unknown cost rather than treating it as zero", () => {
  const known = parsePortfolioCsv('Symbol,Qty,Average Price\nINFY,2,100\nINFY,3,200');
  assert.equal(known.holdings[0].averagePrice, 160);
  const unknown = parsePortfolioCsv('Symbol,Qty,Average Price\nINFY,2,100\nINFY,3,');
  assert.equal(unknown.holdings[0].quantity, 5);
  assert.equal(unknown.holdings[0].averagePrice, null);
  assert.deepEqual(unknown.duplicates, ["INFY"]);
  assert.equal(parsePortfolioCsv('Symbol,Qty\n"INFY,2').holdings.length, 0);
});

test("roast combines lots so splitting one stock does not hide concentration", () => {
  const positions = normaliseHoldings([
    { stock_symbol: "infy", qty: 2, avg_buy_price: 100, buy_date: "2024-01" },
    { stock_symbol: " INFY ", qty: 3, avg_buy_price: 200, buy_date: "2025-01" },
  ]);
  assert.equal(positions.length, 1);
  assert.equal(positions[0].qty, 5);
  assert.equal(positions[0].avg_buy_price, 160);
  assert.equal(positions[0].buy_date, undefined);
});

test("invalid market prices fall back instead of contaminating portfolio calculations", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ chart: { result: [{
    meta: { regularMarketPrice: -1 }, indicators: { quote: [{ close: Array(20).fill(100) }] },
  }] } })));
  const snapshot = await getMarketSnapshot("INFY");
  assert.equal(snapshot.source, "fallback");
  assert.ok(snapshot.price > 0);
});

test("rate-limit capacity preserves long windows and denies excess keys", (context) => {
  let now = 1_000_000;
  context.mock.method(Date, "now", () => now);
  assert.equal(rateLimit("long", { windowMs: 3_600_000, maxRequests: 1 }).success, true);
  for (let index = 0; index < 9_999; index++) rateLimit(`short:${index}`, { maxRequests: 1 });
  assert.equal(rateLimit("overflow").success, false);
  now += 60_001;
  assert.equal(rateLimit("new-short").success, true);
  assert.equal(rateLimit("long", { windowMs: 3_600_000, maxRequests: 1 }).success, false);
  now += 3_600_000;
  assert.equal(rateLimit("long", { windowMs: 3_600_000, maxRequests: 1 }).success, true);
});
