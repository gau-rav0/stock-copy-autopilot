/**
 * Provider-agnostic AI call, configured for your kmichi API first.
 *
 * For kmichi, set:
 *
 *   KMICHI_API_URL   chat/completions endpoint
 *   KMICHI_API_KEY   your kmichi key
 *   KMICHI_MODEL     model name from kmichi
 *
 * Generic aliases also work:
 *
 *   AI_API_URL
 *   AI_API_KEY
 *   AI_MODEL
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: ChatMessage[]): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? "openai-compatible";
  const apiKey = process.env.KMICHI_API_KEY ?? process.env.AI_API_KEY;
  const model = process.env.KMICHI_MODEL ?? process.env.AI_MODEL;

  if (!apiKey) {
    throw new Error(
      "KMICHI_API_KEY is not set. Add it to .env.local, or use AI_API_KEY as a generic alias."
    );
  }

  if (!model) {
    throw new Error(
      "KMICHI_MODEL is not set. Add your kmichi model name to .env.local, or use AI_MODEL as a generic alias."
    );
  }

  if (provider === "anthropic") {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const rest = messages.filter((m) => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }

  const url = process.env.KMICHI_API_URL ?? process.env.AI_API_URL;
  if (!url) {
    throw new Error(
      "KMICHI_API_URL is not set. Add your kmichi chat/completions endpoint to .env.local, or use AI_API_URL as a generic alias."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 300,
    }),
  });
  if (!res.ok) throw new Error(`AI API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Turns a raw allocation change into the notification text a follower sees. */
export async function generateConvictionSummary(input: {
  investorName: string;
  ticker: string;
  allocationBefore: number;
  allocationAfter: number;
  action: string;
}): Promise<string> {
  const { investorName, ticker, allocationBefore, allocationAfter, action } = input;
  return callAI([
    {
      role: "system",
      content:
        "You write one-sentence portfolio conviction alerts. Factual, punchy, no hype words, no exclamation marks. Format like: 'NAME increased TICKER allocation from X% to Y%. Now their #N holding.' Only state what's given, never invent numbers.",
    },
    {
      role: "user",
      content: `Investor: ${investorName}. Ticker: ${ticker}. Action: ${action}. Allocation before: ${allocationBefore}%. Allocation after: ${allocationAfter}%.`,
    },
  ]);
}

/** Reuses the same roast persona from Portfolio Roast for consistency across the funnel. */
export async function generateRoast(metrics: {
  cagr: number;
  maxDrawdown: number;
  concentrationPct: number;
  benchmarkDelta: number;
}): Promise<string> {
  return callAI([
    {
      role: "system",
      content:
        "You are a savage but funny financial roast generator, Indian retail-investor context. 1-2 sentences max. Specific to the numbers given, never generic. No slurs, no real people, no financial advice.",
    },
    {
      role: "user",
      content: `CAGR: ${metrics.cagr}%. Max drawdown: ${metrics.maxDrawdown}%. Top holding concentration: ${metrics.concentrationPct}%. Return vs Nifty 50: ${metrics.benchmarkDelta}%.`,
    },
  ]);
}
