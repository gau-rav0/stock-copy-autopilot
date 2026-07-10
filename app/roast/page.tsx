"use client";

import { ScoreRing } from "@/components/ScoreRing";
import BeginnerModePanel from "@/components/BeginnerModePanel";
import { NSE_UNIVERSE } from "@/data/nse-universe";
import type { HoldingInput, RoastResult } from "@/lib/roast-types";
import { toPng } from "html-to-image";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  Flame,
  Laugh,
  Loader2,
  Plus,
  RotateCcw,
  Share2,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useRef, useState } from "react";

type HoldingRow = HoldingInput & { id: string };

const initialRows: HoldingRow[] = [
  { id: "1", stock_symbol: "RELIANCE", qty: 4, avg_buy_price: 2450, buy_date: "2023-08" },
  { id: "2", stock_symbol: "HDFCBANK", qty: 12, avg_buy_price: 1680, buy_date: "2022-11" },
  { id: "3", stock_symbol: "TATAMOTORS", qty: 20, avg_buy_price: 710, buy_date: "2023-03" },
  { id: "4", stock_symbol: "INFY", qty: 8, avg_buy_price: 1580, buy_date: "" },
  { id: "5", stock_symbol: "ITC", qty: 30, avg_buy_price: 410, buy_date: "2021-06" }
];

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const formatPct = (value: number | null) => (value === null ? "n/a" : `${value.toFixed(1)}%`);

const newRow = (): HoldingRow => ({
  id: crypto.randomUUID(),
  stock_symbol: "",
  qty: 1,
  avg_buy_price: 100,
  buy_date: ""
});

const scoreBand = (score: number) => {
  if (score >= 78) return "Market Adult";
  if (score >= 60) return "Almost Civilized";
  if (score >= 42) return "Group Chat Alpha";
  return "Capital At Risk";
};

const scoreTone = (score: number) => {
  if (score >= 70) return "text-gain";
  if (score >= 45) return "text-paper";
  return "text-loss";
};

const memeVerdict = (result: RoastResult) => {
  if (result.metrics.absolute_return_pct < -10) {
    return {
      headline: "Your portfolio got cooked.",
      punchline: "Even the spreadsheet opened incognito before showing this.",
      sticker: "LOL"
    };
  }

  if (result.metrics.concentration_pct >= 45) {
    return {
      headline: "One stock is your whole personality.",
      punchline: "That is not conviction. That is a hostage situation with a ticker symbol.",
      sticker: "BRUH"
    };
  }

  if (result.metrics.max_drawdown_pct >= 18) {
    return {
      headline: "This drawdown did not dip. It relocated.",
      punchline: "Your portfolio went for a walk and forgot the way back.",
      sticker: "OOF"
    };
  }

  if (result.score >= 70) {
    return {
      headline: "Annoyingly decent.",
      punchline: "Not perfect, but the portfolio has fewer crimes than expected.",
      sticker: "OK"
    };
  }

  return {
    headline: "Playable, but still not beating the allegations.",
    punchline: "The returns are trying. The risk is doing stand-up comedy.",
    sticker: "YIKES"
  };
};

const ALL_LOADING_LINES = [
  "Comparing you with a ₹500/month SIP that did better...",
  "Asking Nifty 50 if this was even necessary...",
  "Checking whether diversification left the group chat...",
  "Calculating emotional damage per rupee...",
  "Your FD would like a word...",
  "Running your portfolio through a disappointment index...",
  "Cross-referencing your conviction with your sell history...",
  "Measuring the gap between your Twitter bio and your CAGR...",
  "Checking if your broker has a loyalty discount for losses...",
  "Consulting the spreadsheet your portfolio tried to delete...",
  "Simulating what would've happened with literally any ETF...",
  "Your risk-adjusted return just filed an RTI...",
];

const LOADING_HEADLINES = [
  "Auditing the chaos.",
  "Consulting better life choices.",
  "Your portfolio entered the room.",
  "Benchmarking against common sense.",
  "Running the numbers. Regretting already.",
];

const LOADING_SUBTITLES = [
  "We are benchmarking your portfolio against a ₹500/month index plan and several better life choices.",
  "Somewhere, a fixed deposit is laughing. We're calculating exactly how loud.",
  "Your mutual fund agent saw this portfolio and asked if you need to talk.",
  "The algorithm is doing math. The math is doing therapy.",
];

const FUNNEL_STEPS = [
  ["01", "Roast", "Enter holdings and reveal concentration, drawdown, and return signals."],
  ["02", "Learn", "Translate the score into beginner-friendly risk and diversification notes."],
  ["03", "Compare", "Move into verified demo investor profiles ranked by evidence quality."],
  ["04", "Follow", "Receive read-only allocation alerts without copy trading or order execution."],
];

export default function Home() {
  const [rows, setRows] = useState<HoldingRow[]>(initialRows);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const symbols = useMemo(() => NSE_UNIVERSE.map((stock) => stock.symbol), []);

  const updateRow = (id: string, patch: Partial<HoldingRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLoadingPhase(0);
    setError("");

    // Pick 6 random lines for this session
    const shuffled = [...ALL_LOADING_LINES].sort(() => Math.random() - 0.5).slice(0, 6);
    setVisibleLines([]);

    // Reveal lines one-by-one with staggered timing
    const lineTimers: ReturnType<typeof setTimeout>[] = [];
    shuffled.forEach((line, i) => {
      lineTimers.push(setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, 600 + i * 700));
    });

    // Rotate headlines
    const headlineTimer = setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % LOADING_HEADLINES.length);
    }, 1400);

    try {
      // Run the API call AND the minimum banter delay in parallel
      const [response] = await Promise.all([
        fetch("/api/roast", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            displayName,
            email,
            holdings: rows.map(({ id: _id, ...row }) => row)
          })
        }),
        new Promise((resolve) => setTimeout(resolve, 4200)),
      ]);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Roast failed.");
      }

      setResult(json as RoastResult);
      setShowResultModal(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not roast this portfolio.");
    } finally {
      lineTimers.forEach(clearTimeout);
      clearInterval(headlineTimer);
      setLoading(false);
    }
  };

  const renderCard = async () => {
    if (!cardRef.current) {
      throw new Error("Share card is not ready yet.");
    }

    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#07080a"
    });
  };

  const downloadCard = async () => {
    if (!result) return;

    setSharing(true);
    try {
      const dataUrl = await renderCard();
      const link = document.createElement("a");
      link.download = "portfolio-roast.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setSharing(false);
    }
  };

  const shareCard = async () => {
    if (!result) return;

    setSharing(true);
    try {
      const dataUrl = await renderCard();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "portfolio-roast.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Portfolio Roast", text: result.verdict });
      } else {
        await downloadCard();
      }
    } finally {
      setSharing(false);
    }
  };

  const totalInputValue = rows.reduce((sum, row) => sum + Number(row.qty || 0) * Number(row.avg_buy_price || 0), 0);
  const topSectors = result?.metrics.sector_exposure.slice(0, 4) ?? [];
  const meme = result ? memeVerdict(result) : null;

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[url('/roast-terminal.png')] bg-cover bg-center opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(97,222,142,.2),transparent_30rem),linear-gradient(90deg,#080808_0%,rgba(8,8,8,.96)_38%,rgba(8,8,8,.74)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brass text-white shadow-[0_0_40px_rgba(0,157,85,.28)]">
                <Flame size={21} />
              </div>
              <div>
                <div className="font-[var(--font-space-grotesk)] text-sm font-black uppercase tracking-[0.22em]">Portfolio Roast</div>
              <div className="text-xs font-semibold text-white/45">NSE demo edition</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs font-bold text-white/70 backdrop-blur sm:flex">
              <Zap size={14} className="text-brass-bright" />
              No login. No broker connect. No advice.
            </div>
          </header>

          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,.9fr)_minmax(520px,1.1fr)]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs font-bold leading-5 text-white/78 backdrop-blur sm:text-sm">
                <Sparkles size={16} className="shrink-0 text-brass-bright" />
                <span className="min-w-0">Paste holdings. Get an educational roast.</span>
              </div>
              <h1 className="max-w-3xl font-[var(--font-space-grotesk)] text-[clamp(2.2rem,9.6vw,6.9rem)] font-black leading-[.98] tracking-normal sm:leading-[.86]">
                Your portfolio, but with consequences.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
                A share card backed by return, drawdown, concentration, sector exposure, and timing math.
                Fictional flow only; not investment advice.
              </p>

              <div className="mt-8 grid max-w-2xl gap-2 sm:grid-cols-3 sm:gap-3">
                <HeroStat label="Rows" value={`${rows.length}/10`} />
                <HeroStat label="Input value" value={money.format(totalInputValue)} />
                <HeroStat label="Mode" value={result?.generated_by === "openai" ? "AI" : "Math"} />
              </div>

              <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                {FUNNEL_STEPS.map(([num, title, body]) => (
                  <div key={num} className="rounded-lg border border-white/10 bg-white/[.045] p-3 backdrop-blur">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-bright">{num}</p>
                    <p className="mt-1 font-[var(--font-space-grotesk)] text-base font-black text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/52">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <BeginnerModePanel context="roast" />
              <form onSubmit={submit} className="tool-panel">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-white/38">Roast ticket</div>
                    <h2 className="mt-1 font-[var(--font-space-grotesk)] text-2xl font-black">Holdings</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => rows.length < 10 && setRows((current) => [...current, newRow()])}
                    disabled={rows.length >= 10}
                    className="icon-button"
                    title="Add holding"
                  >
                    <Plus size={19} />
                  </button>
                </div>

                <datalist id="nse-symbols">
                  {symbols.map((symbol) => (
                    <option key={symbol} value={symbol} />
                  ))}
                </datalist>

                <div className="space-y-2">
                  <div className="hidden grid-cols-[1.24fr_.55fr_.72fr_.88fr_36px] gap-2 px-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/32 md:grid">
                    <span>Symbol</span>
                    <span>Qty</span>
                    <span>Avg</span>
                    <span>Month</span>
                    <span />
                  </div>

                  {rows.map((row) => (
                    <div key={row.id} className="holding-row">
                      <label>
                        <span className="mobile-label">Symbol</span>
                        <input
                          list="nse-symbols"
                          value={row.stock_symbol}
                          onChange={(event) => updateRow(row.id, { stock_symbol: event.target.value.toUpperCase() })}
                          className="input-field font-black uppercase"
                          placeholder="RELIANCE"
                        />
                      </label>
                      <label>
                        <span className="mobile-label">Qty</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.qty}
                          onChange={(event) => updateRow(row.id, { qty: Number(event.target.value) })}
                          className="input-field number-input"
                        />
                      </label>
                      <label>
                        <span className="mobile-label">Avg</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.avg_buy_price}
                          onChange={(event) => updateRow(row.id, { avg_buy_price: Number(event.target.value) })}
                          className="input-field number-input"
                        />
                      </label>
                      <label>
                        <span className="mobile-label">Month</span>
                        <input
                          type="month"
                          value={row.buy_date ?? ""}
                          onChange={(event) => updateRow(row.id, { buy_date: event.target.value })}
                          className="input-field"
                        />
                      </label>
                      <button type="button" onClick={() => removeRow(row.id)} className="icon-button subtle" title="Remove holding">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Display name"
                    className="input-field"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Waitlist email"
                    className="input-field"
                  />
                </div>

                {error ? <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">{error}</div> : null}

                <button type="submit" disabled={loading} className="primary-button mt-5">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Flame size={20} />}
                {loading ? "Auditing the chaos..." : "Roast My Portfolio"}
              </button>
              <p className="mt-3 text-center text-xs font-semibold text-white/45">
                Educational output only. No copy trading, no order execution, no recommendations.
              </p>
              </form>

              <div className="grid grid-cols-3 gap-2">
                <MiniTile icon={<ShieldAlert size={16} />} label="Risk" value={result ? `${result.risk_score}` : "live"} />
                <MiniTile icon={<BadgeIndianRupee size={16} />} label="Return" value={result ? formatPct(result.metrics.absolute_return_pct) : "calc"} />
                <MiniTile icon={<Share2 size={16} />} label="Card" value="PNG" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {result ? (
        <section id="result" className="relative border-t border-white/10 bg-ink px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,.92fr)_minmax(460px,1.08fr)]">
            <div className="result-panel">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-white/36">Portfolio verdict</div>
                  <h2 className="text-wrap-safe mt-3 max-w-3xl font-[var(--font-space-grotesk)] text-[clamp(1.9rem,13vw,5rem)] font-black leading-[.95] sm:leading-[.9]">
                    {result.verdict}
                  </h2>
                </div>
                <div className="score-chip">
                  <span className={scoreTone(result.score)}>{result.score}</span>
                  <small>{scoreBand(result.score)}</small>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {result.roast_lines.map((line, index) => (
                  <div key={line} className="roast-line">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{line}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ScoreRing score={result.risk_score} label="Risk Score" tone="risk" />
                <ScoreRing score={result.diversification_score} label="Diversification" tone="good" />
                <ScoreRing score={result.conviction_score} label="Conviction" />
                <ScoreRing score={result.timing_score} label="Timing" />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={downloadCard} disabled={sharing} className="primary-button w-auto px-5">
                  {sharing ? <Loader2 className="animate-spin" size={18} /> : <ArrowDownToLine size={18} />}
                  Download
                </button>
                <button type="button" onClick={shareCard} disabled={sharing} className="secondary-button">
                  <Share2 size={18} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setShowResultModal(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="secondary-button"
                >
                  <RotateCcw size={18} />
                  Again
                </button>
                <Link href="/explore?from=roast&focus=trust" className="secondary-button px-4">
                  Compare Trust Scores
                </Link>
              </div>
            </div>

            <div className="grid gap-5">
              <div ref={cardRef} className="share-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-base font-black uppercase tracking-[0.14em] sm:text-xl sm:tracking-[0.18em]">Portfolio Roast</div>
                    <div className="mt-1 text-sm font-bold text-white/50">{displayName ? `${displayName}'s Portfolio` : "Anonymous Portfolio"}</div>
                  </div>
                  <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">{result.generated_by === "openai" ? "AI" : "MATH"}</div>
                </div>

                <div className="my-9">
                  <div className={`font-[var(--font-space-grotesk)] text-[clamp(4.5rem,28vw,8rem)] font-black leading-none ${scoreTone(result.score)}`}>{result.score}</div>
                  <div className="text-wrap-safe max-w-xl font-[var(--font-space-grotesk)] text-[clamp(2rem,10vw,3rem)] font-black leading-[.98]">{meme?.headline ?? result.verdict}</div>
                  <div className="text-wrap-safe mt-4 max-w-xl text-xl font-black leading-tight text-white/76 sm:text-2xl">{meme?.punchline}</div>
                </div>

                <div className="grid gap-3">
                  {result.roast_lines.slice(0, 2).map((line) => (
                    <div key={line} className="rounded-2xl border border-white/10 bg-black/34 p-4 text-xl font-bold leading-8 backdrop-blur">
                      {line}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/12 pt-4 text-sm font-black uppercase tracking-[0.16em] text-white/55">
                  <span>Educational only</span>
                  <span>FVI demo</span>
                </div>
              </div>

              <div className="analytics-panel">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-[var(--font-space-grotesk)] text-2xl font-black">Damage Report</h3>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-2 text-sm font-black">
                    {result.metrics.absolute_return_pct >= 0 ? <TrendingUp size={17} className="text-gain" /> : <TrendingDown size={17} className="text-loss" />}
                    {formatPct(result.metrics.absolute_return_pct)}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Metric label="Current" value={money.format(result.metrics.current_value)} />
                  <Metric label="Invested" value={money.format(result.metrics.invested_value)} />
                  <Metric label="Drawdown" value={formatPct(result.metrics.max_drawdown_pct)} />
                  <Metric label="CAGR" value={formatPct(result.metrics.cagr_pct)} />
                  <Metric label="Nifty" value={formatPct(result.metrics.benchmark_cagr_pct)} />
                  <Metric label="Top weight" value={formatPct(result.metrics.concentration_pct)} />
                </div>

                <div className="mt-5 grid gap-3">
                  {topSectors.map((sector) => (
                    <div key={sector.sector}>
                      <div className="mb-2 flex items-center justify-between text-sm font-bold text-white/62">
                        <span>{sector.sector}</span>
                        <span>{sector.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-brass shadow-[0_0_18px_rgba(97,222,142,.35)]" style={{ width: `${Math.min(100, sector.percentage)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {result && showResultModal ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/76 px-4 py-6 backdrop-blur-xl">
          <div className="result-modal meme-modal w-full max-w-5xl">
            <div className="grid gap-5 md:grid-cols-[.72fr_1.28fr]">
              <div className="meme-reaction">
                <div className="meme-sticker">{meme?.sticker}</div>
                <div className="reaction-face">
                  <Laugh size={74} />
                </div>
                <div className="reaction-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <p>Live footage of your risk score entering the room.</p>
              </div>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/58">
                    <CheckCircle2 size={14} className="text-loss" />
                    Roast receipt
                  </div>
                  <div className="score-chip compact-score">
                    <span className={scoreTone(result.score)}>{result.score}</span>
                    <small>{scoreBand(result.score)}</small>
                  </div>
                </div>

                <h2 className="text-wrap-safe mt-5 max-w-3xl font-[var(--font-space-grotesk)] text-[clamp(2rem,13vw,4.8rem)] font-black leading-[.92] sm:leading-[.88]">
                  {meme?.headline}
                </h2>
                <p className="mt-4 max-w-2xl text-xl font-black leading-snug text-white/76 sm:text-2xl">
                  {meme?.punchline}
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-loss">Court evidence</p>
                  <p className="mt-2 text-base font-bold leading-7 text-white/74">{result.roast_lines[0] ?? result.verdict}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Return" value={formatPct(result.metrics.absolute_return_pct)} />
              <Metric label="Drawdown" value={formatPct(result.metrics.max_drawdown_pct)} />
              <Metric label="Top weight" value={formatPct(result.metrics.concentration_pct)} />
            </div>

            <div className="trust-callout mt-5 p-4">
              <p className="font-[var(--font-space-grotesk)] text-lg font-black text-white">
                Next: compare investors by Trust Score, drawdowns, holdings, and allocation changes.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                No copy trading, no orders, no advice. Just read-only track records so the next decision
                is based on evidence instead of screenshots.
              </p>
            </div>

            <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap">
              <Link href="/explore?from=roast&focus=trust" className="primary-button trust-button w-auto px-6">
                Show Trust Score matches
                <ArrowRight size={18} />
              </Link>
              <button type="button" onClick={shareCard} disabled={sharing} className="secondary-button">
                {sharing ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                Share roast
              </button>
              <button type="button" onClick={downloadCard} disabled={sharing} className="secondary-button">
                <ArrowDownToLine size={18} />
                Download meme
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  requestAnimationFrame(() => {
                    document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
                className="secondary-button"
              >
                View full report
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResultModal(false);
                  setResult(null);
                }}
                className="secondary-button"
              >
                Edit holdings
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/82 px-4 backdrop-blur-2xl">
          <div className="loading-roast-card w-full max-w-2xl">
            <div className="loading-orbit" aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-loss/30 bg-loss/10 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.16em] text-loss">
              <Loader2 className="animate-spin" size={14} />
              Roast engine warming up
            </div>
            <h2 key={loadingPhase} className="loading-headline mt-5 font-[var(--font-space-grotesk)] text-[clamp(2.2rem,7vw,5rem)] font-black leading-[.88] text-white">
              {LOADING_HEADLINES[loadingPhase]}
            </h2>
            <p key={`sub-${loadingPhase}`} className="loading-subtitle mt-4 max-w-xl text-lg font-bold leading-7 text-white/62">
              {LOADING_SUBTITLES[loadingPhase % LOADING_SUBTITLES.length]}
            </p>
            <div className="mt-6 grid gap-2">
              {visibleLines.map((line, index) => (
                <div key={line} className="loading-line loading-line-enter" style={{ animationDelay: `${index * 80}ms` }}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{line}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="loading-progress h-full rounded-full bg-loss" />
              </div>
              <span className="shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white/32">
                {visibleLines.length}/{ALL_LOADING_LINES.length > 6 ? 6 : ALL_LOADING_LINES.length} checks
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3 backdrop-blur">
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/34">{label}</div>
      <div className="mt-2 truncate font-[var(--font-space-grotesk)] text-xl font-black">{value}</div>
    </div>
  );
}

function MiniTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3 backdrop-blur">
      <div className="flex items-center justify-between text-white/45">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-4 font-[var(--font-space-grotesk)] text-xl font-black">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.055] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">{label}</div>
      <div className="mt-2 truncate font-[var(--font-space-grotesk)] text-lg font-black text-white">{value}</div>
    </div>
  );
}
