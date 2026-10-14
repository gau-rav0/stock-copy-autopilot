"use client";
import { useRef, useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Plus, X, Download, Share2, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { NSE_UNIVERSE } from "@/data/nse-universe";
import type { RoastResult } from "@/lib/roast-types";
import { parsePortfolioCsv } from "@/lib/portfolio-import";
import Dialog from "@/components/Dialog";
import RoastLoading from "@/components/RoastLoading";
import WaitlistSignup from "@/components/WaitlistSignup";
import { trackEvent } from "@/lib/product-events";
type Row = {
  id: string;
  stock_symbol: string;
  qty: string;
  avg_buy_price: string;
  buy_date: string;
};
const blank = (): Row => ({
  id: crypto.randomUUID(),
  stock_symbol: "",
  qty: "1",
  avg_buy_price: "",
  buy_date: "",
});
const sample = (): Row[] =>
  [
    ["HDFCBANK", "10", "1600", "2023-01"],
    ["INFY", "5", "1500", "2023-06"],
    ["ITC", "20", "400", "2022-11"],
  ].map(([stock_symbol, qty, avg_buy_price, buy_date], i) => ({
    id: `sample-${i}`,
    stock_symbol,
    qty,
    avg_buy_price,
    buy_date,
  }));
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const pct = (value: number | null) =>
  value === null
    ? "Unavailable"
    : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const dataNote = (r: RoastResult) =>
  r.market_data_source === "fallback" || r.benchmark_data_source === "fallback"
    ? "Illustrative data · one or more stock or benchmark quotes were unavailable."
    : "Yahoo Finance quotes · may be delayed. Estimates, not audited portfolio returns.";
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function RoastTool() {
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[]>(() =>
    params.get("sample") === "1" ? sample() : [blank()],
  );
  const [isSample, setIsSample] = useState(params.get("sample") === "1");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [resultSample, setResultSample] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareError, setShareError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [csv, setCsv] = useState("");
  const card = useRef<HTMLDivElement>(null);
  const roastRequest = useRef<AbortController | null>(null);
  function update(id: string, patch: Partial<Row>) {
    setIsSample(false);
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }
  function loadSample() {
    setRows(sample());
    setIsSample(true);
    setError("");
    setResult(null);
    trackEvent("sample_start");
  }
  function importCsv() {
    const parsed = parsePortfolioCsv(csv);
    if (!parsed.holdings.length) {
      setError(
        parsed.errors.join(" ") ||
          "No holdings found. Use Symbol, Qty, Average Price columns.",
      );
      return;
    }
    if (parsed.holdings.length > 10) {
      setError("Use up to 10 stock positions.");
      return;
    }
    setRows(
      parsed.holdings.map((h) => ({
        id: crypto.randomUUID(),
        stock_symbol: h.symbol,
        qty: String(h.quantity),
        avg_buy_price: h.averagePrice === null ? "" : String(h.averagePrice),
        buy_date: "",
      })),
    );
    setIsSample(false);
    setError(parsed.errors.join(" "));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setShareError("");
    trackEvent("roast_started");
    const controller = new AbortController();
    roastRequest.current = controller;
    const timeout = setTimeout(
      () =>
        controller.abort(new DOMException("Request timed out", "TimeoutError")),
      30000,
    );
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          holdings: rows.map(
            ({ stock_symbol, qty, avg_buy_price, buy_date }) => ({
              stock_symbol,
              qty: Number(qty),
              avg_buy_price: Number(avg_buy_price),
              buy_date: buy_date || undefined,
            }),
          ),
        }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.error || "Could not generate the roast. Please try again.",
        );
      setResult(json);
      setResultSample(isSample);
      setModal(true);
      trackEvent("roast_success");
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "Roast cancelled. Your holdings are still here."
          : err instanceof Error && err.name !== "TimeoutError"
            ? err.message
            : "This is taking longer than expected. Please try again.",
      );
      trackEvent("roast_error");
    } finally {
      clearTimeout(timeout);
      roastRequest.current = null;
      setLoading(false);
    }
  }
  async function exportCard(share = false) {
    if (!card.current || !result) return;
    setSharing(true);
    setShareError("");
    try {
      const data = await toPng(card.current, {
        pixelRatio: 2,
        backgroundColor: "#14201b",
      });
      const blob = await (await fetch(data)).blob();
      const file = new File([blob], "fvi-portfolio-roast.png", {
        type: "image/png",
      });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "FVI portfolio roast",
          text: "Educational holding estimates. fvi-ochre.vercel.app/roast",
        });
      } else {
        const link = document.createElement("a");
        link.download = file.name;
        link.href = data;
        link.click();
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError"))
        setShareError(
          "Could not create the share card. Try again, or use the report on this page.",
        );
    } finally {
      setSharing(false);
    }
  }
  function viewReport() {
    setModal(false);
    requestAnimationFrame(() =>
      document
        .getElementById("result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  const checked = result
    ? new Date(result.data_checked_at).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  return (
    <div className="tool-page page-shell">
      <div className="tool-heading">
        <div>
          <p className="eyebrow">FVI / Portfolio roast</p>
          <h1>A closer look at your holdings.</h1>
          <p>
            Find concentrated bets and sector exposure. Get a frank roast, with
            the assumptions attached.
          </p>
        </div>
        <button className="button-secondary" onClick={loadSample}>
          Try sample portfolio <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="tool-layout">
        <form onSubmit={submit} className="holdings-panel">
          <div className="panel-heading">
            <h2>{isSample ? "Sample holdings" : "Your holdings"}</h2>
            <span>{rows.length}/10 rows</span>
          </div>
          {isSample && (
            <p className="form-help mb-5">
              Fictional sample. Change the rows to analyse your own positions.
            </p>
          )}
          <datalist id="nse-symbols">
            {NSE_UNIVERSE.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.name}
              </option>
            ))}
          </datalist>
          {rows.map((row, index) => (
            <div className="holding-row" key={row.id}>
              <label>
                <span className="field-label">NSE symbol</span>
                <input
                  aria-label={`Stock ${index + 1}`}
                  list="nse-symbols"
                  required
                  maxLength={30}
                  className="input-field uppercase"
                  value={row.stock_symbol}
                  placeholder="INFY"
                  onChange={(e) =>
                    update(row.id, {
                      stock_symbol: e.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label>
                <span className="field-label">Quantity</span>
                <input
                  aria-label={`Quantity ${index + 1}`}
                  type="number"
                  required
                  min="0.001"
                  max="10000000"
                  step="any"
                  className="input-field"
                  value={row.qty}
                  onChange={(e) => update(row.id, { qty: e.target.value })}
                />
              </label>
              <label>
                <span className="field-label">Avg cost / ₹</span>
                <input
                  aria-label={`Average cost ${index + 1}`}
                  type="number"
                  required
                  min="0.01"
                  max="10000000"
                  step="any"
                  className="input-field"
                  value={row.avg_buy_price}
                  placeholder="1500"
                  onChange={(e) =>
                    update(row.id, { avg_buy_price: e.target.value })
                  }
                />
              </label>
              <label>
                <span className="field-label">
                  Buy month <span className="opacity-70">/ optional</span>
                </span>
                <input
                  aria-label={`Buy month ${index + 1}`}
                  type="month"
                  max={new Date().toISOString().slice(0, 7)}
                  className="input-field"
                  value={row.buy_date}
                  onChange={(e) => update(row.id, { buy_date: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="row-remove"
                disabled={rows.length === 1}
                aria-label={`Remove holding ${index + 1}`}
                onClick={() => {
                  setIsSample(false);
                  setRows((current) => current.filter((r) => r.id !== row.id));
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {error && (
            <p role="alert" className="notice notice-error mb-4">
              {error}
            </p>
          )}
          <div className="holding-actions">
            <button
              type="button"
              disabled={rows.length >= 10}
              onClick={() => setRows([...rows, blank()])}
              className="text-link"
            >
              <Plus size={16} />
              Add holding
            </button>
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Checking your holdings…
                </>
              ) : (
                <>
                  Roast {isSample ? "the sample" : "my portfolio"}
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </div>
          <p className="form-help mt-4">
            No login. No broker connection. Stocks entered twice are combined.
          </p>
          <details className="import-details">
            <summary>Paste a CSV instead</summary>
            <div>
              <label className="field-label" htmlFor="roast-csv">
                CSV holdings
              </label>
              <textarea
                id="roast-csv"
                className="input-field"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder={"Symbol,Qty,Average Price\nINFY,10,1500"}
              />
              <p className="form-help my-3">
                Up to 10 positions. Fill in missing cost prices before analysis.
              </p>
              <button
                type="button"
                onClick={importCsv}
                className="button-secondary"
              >
                Use these holdings
              </button>
            </div>
          </details>
        </form>
        <aside className="tool-aside">
          <span className="demo-label">Know the limits</span>
          <h2>
            The numbers come
            <br />
            with context.
          </h2>
          <ul>
            <li>
              Current prices where available. Illustrative values are clearly
              labelled.
            </li>
            <li>Concentration by stock and exposure by sector.</li>
            <li>
              Holding-level estimates. No reconstructed cash-flow or transaction
              history.
            </li>
          </ul>
          <p className="mt-6">
            A roast is a perspective, not a recommendation.
          </p>
          <Link href="/privacy" className="text-link mt-4">
            How your data is handled <ArrowUpRight size={14} />
          </Link>
        </aside>
      </div>
      {result && (
        <section id="result" className="result-panel scroll-mt-24">
          <div className="result-title">
            <div>
              <p className="eyebrow mb-3">
                {resultSample ? "Sample portfolio" : "Your portfolio"} / The
                verdict
              </p>
              <h2>{result.verdict}</h2>
            </div>
            <div className="result-score">
              {result.score}
              <span>
                /100
                <br />
                Roast score
              </span>
            </div>
          </div>
          <div className="roast-lines">
            {result.roast_lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="metric-grid">
            <Metric
              label="Stock concentration"
              value={`${result.metrics.concentration_pct.toFixed(1)}%`}
            />
            <Metric
              label="Sector exposure"
              value={`${result.metrics.unique_sectors} sectors`}
            />
            <Metric
              label="Estimated current value"
              value={money.format(result.metrics.current_value)}
            />
            <Metric
              label="Return on entered cost / estimate"
              value={pct(result.metrics.absolute_return_pct)}
            />
            <Metric
              label="Annualized holding estimate"
              value={pct(result.metrics.cagr_pct)}
            />
            <Metric
              label="Weighted stock drawdown / proxy"
              value={`${result.metrics.max_drawdown_pct.toFixed(1)}%`}
            />
            <Metric
              label="Nifty context / approximate period"
              value={pct(result.metrics.benchmark_cagr_pct)}
            />
            <Metric label="Risk heuristic" value={`${result.risk_score}/100`} />
          </div>
          <p className="data-note">
            <strong>{dataNote(result)}</strong>
            <br />
            Checked {checked} IST. Historical stock coverage: up to one year.
            Not realized portfolio CAGR or portfolio maximum drawdown.
          </p>
          <details className="import-details">
            <summary>Method, sources & limitations</summary>
            <div>
              {result.warnings.map((w) => (
                <p className="form-help mb-3" key={w}>
                  {w}
                </p>
              ))}
            </div>
          </details>
          {result.leadStored === false && (
            <p role="alert" className="notice mt-5">
              Your roast is ready, but your email was not saved. Use the
              early-access form below to try again.
            </p>
          )}
          <div className="result-actions">
            <button
              onClick={() => void exportCard()}
              disabled={sharing}
              className="button-secondary"
            >
              <Download size={16} />
              Download card
            </button>
            <button
              onClick={() => void exportCard(true)}
              disabled={sharing}
              className="button-secondary"
            >
              <Share2 size={16} />
              Share roast
            </button>
            <button
              onClick={() =>
                document
                  .querySelector("form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-link"
            >
              Edit holdings
            </button>
          </div>
          {shareError && (
            <p role="alert" className="notice notice-error mt-4">
              {shareError}
            </p>
          )}
          <div ref={card} className="share-card">
            <div className="share-brand">
              <strong>fvi. / Portfolio roast</strong>
              <span>
                {resultSample ? "Fictional sample" : "Entered holdings"}
              </span>
            </div>
            <h3>{result.verdict}</h3>
            <div className="roast-lines">
              {result.roast_lines.slice(0, 2).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="metric-grid">
              <Metric
                label="Roast score / heuristic"
                value={`${result.score}/100`}
              />
              <Metric
                label="Top stock exposure"
                value={`${result.metrics.concentration_pct.toFixed(1)}%`}
              />
              <Metric
                label="Return on cost / estimate"
                value={pct(result.metrics.absolute_return_pct)}
              />
              <Metric
                label="Weighted stock drawdown / proxy"
                value={`${result.metrics.max_drawdown_pct.toFixed(1)}%`}
              />
            </div>
            <p className="data-note">
              {dataNote(result)}
              <br />
              Checked {checked} IST. Up to one year of stock history.
              <br />
              Holding estimates, not actual portfolio performance. Educational
              only.
            </p>
            <p className="data-note">fvi-ochre.vercel.app/roast</p>
          </div>
          <div className="result-funnel">
            <div>
              <h3>Better evidence for your next read.</h3>
              <p>
                Get notified when reviewed creator profiles launch. Today’s
                directory is a fictional preview.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-link"
              onClick={() => trackEvent("preview_open")}
            >
              Inspect an example <ArrowUpRight size={16} />
            </Link>
          </div>
          <WaitlistSignup source="roast_result" />
        </section>
      )}
      {loading && (
        <RoastLoading onCancel={() => roastRequest.current?.abort()} />
      )}
      {!loading && modal && result && (
        <Dialog
          title="Your portfolio roast result"
          onClose={() => setModal(false)}
        >
          <p className="eyebrow">
            {resultSample ? "Fictional sample" : "Entered holdings"} / Analysis
            complete
          </p>
          <div className="result-score">
            {result.score}
            <span>/100 · Roast score</span>
          </div>
          <h2>{result.verdict}</h2>
          <p>{result.roast_lines[0]}</p>
          <p className="data-note mt-5">
            {dataNote(result)}
            <br />
            Holding-level estimates. Not actual portfolio performance.
          </p>
          <div className="result-actions">
            <button className="button-primary" onClick={viewReport}>
              View full report <ArrowUpRight size={16} />
            </button>
            <button
              className="button-secondary"
              onClick={() => setModal(false)}
            >
              Close
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
export default function RoastPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell tool-page">
          <p role="status">Loading the portfolio tool…</p>
        </div>
      }
    >
      <RoastTool />
    </Suspense>
  );
}
