import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatePortfolio } from "../lib/portfolio";
import { calculateTrustScore } from "../lib/trust-score";
import { getProfile, holdingsByProfile } from "../lib/demo-data";
import { POST } from "../app/api/creator-applications/route";

test("equivalent split positions produce identical roast results and sources remain explicit", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("%5ENSEI"))
      return new Response("{}", { status: 503 });
    return new Response(
      JSON.stringify({
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 100 },
              indicators: { quote: [{ close: Array(24).fill(100) }] },
            },
          ],
        },
      }),
    );
  };
  try {
    const holding = {
      stock_symbol: "INFY",
      qty: 10,
      avg_buy_price: 100,
      buy_date: "2023-01",
    };
    const one = await calculatePortfolio([holding]);
    const split = await calculatePortfolio(
      Array.from({ length: 5 }, () => ({ ...holding, qty: 2 })),
    );
    assert.deepEqual(one.metrics, split.metrics);
    assert.equal(one.score, split.score);
    assert.equal(one.metrics.concentration_pct, 100);
    assert.equal(one.benchmark_data_source, "fallback");
    assert.equal(one.metric_method, "holding_estimates");
    assert.ok(one.warnings.some((w) => w.includes("illustrative benchmark")));
    assert.ok(
      one.warnings.some((w) =>
        w.includes("not realized portfolio performance"),
      ),
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("card and detail use the same complete holdings count for Trust Score", () => {
  const base = getProfile("arjun-mehta")!;
  const holdings = holdingsByProfile[base.id];
  const profile = {
    ...base,
    isDemo: true,
    verified: false,
    holdingsCount: holdings.length,
  };
  assert.equal(
    calculateTrustScore(profile, holdings.slice(0, 3)).score,
    calculateTrustScore(profile, holdings).score,
  );
});

test("CAS method cannot be submitted using JSON holdings instead of an original file", async () => {
  const response = await POST(
    new Request("http://localhost/api/creator-applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "cas-no-file",
      },
      body: JSON.stringify({
        email: "fixture@example.test",
        method: "cas",
        holdingsText: "INFY, 100%",
      }),
    }),
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /original PDF or text statement/);
});
