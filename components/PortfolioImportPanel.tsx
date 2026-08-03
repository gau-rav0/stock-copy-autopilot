"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { parsePortfolioCsv, type PortfolioImportResult } from "@/lib/portfolio-import";

type ImportRecord = { id: string; status: string; holdings: { symbol: string; quantity: number }[]; created_at: string };

export default function PortfolioImportPanel() {
  const [result, setResult] = useState<PortfolioImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [recent, setRecent] = useState<ImportRecord[]>([]);

  useEffect(() => {
    fetch("/api/portfolio-imports").then((response) => response.ok ? response.json() : null).then((data) => setRecent(data?.imports ?? [])).catch(() => undefined);
  }, []);

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) { setStatus("error"); setMessage("CSV files must be under 1 MB."); return; }
    const contents = await file.text();
    setFileName(file.name);
    setCsv(contents);
    setResult(parsePortfolioCsv(contents));
    setStatus("idle");
    setMessage("");
  };

  const saveImport = async () => {
    if (!csv || !result?.holdings.length) return;
    setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/portfolio-imports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv }) });
      const data = await response.json();
      if (!response.ok && !data.import) throw new Error(data.error ?? "Could not import this file.");
      setRecent((current) => [data.import, ...current].slice(0, 5));
      setStatus("success"); setMessage(`${result.holdings.length} holding${result.holdings.length === 1 ? "" : "s"} imported securely.`);
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Could not import this file."); }
  };

  return <section className="rounded-xl border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
    <div className="flex gap-3"><div className="mt-0.5 rounded-lg border border-brass/30 bg-brass/10 p-2 text-brass"><FileUp size={18} /></div><div><h2 className="font-display text-lg text-paper">Import portfolio</h2><p className="mt-1 text-sm leading-5 text-paper-muted">Upload a CSV from your broker. We validate symbols and show issues before saving anything.</p></div></div>
    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brass/40 px-4 py-3 text-sm font-medium text-brass transition hover:border-brass"><FileUp size={16} />{fileName || "Choose CSV file"}<input className="sr-only" type="file" accept=".csv,text/csv" onChange={selectFile} /></label>
    {result && <div className="mt-4 space-y-3 text-sm"><div className="rounded-lg border border-ink-hairline p-3 text-paper-muted"><span className="font-medium text-paper">{result.holdings.length}</span> valid holdings from {result.totalRows} row{result.totalRows === 1 ? "" : "s"}.</div>
      {result.duplicates.length > 0 && <p className="text-paper-muted">Combined duplicates: {result.duplicates.join(", ")}</p>}
      {result.missingSymbols.length > 0 && <p className="text-amber-200">Unrecognised symbols (saved for review): {result.missingSymbols.join(", ")}</p>}
      {result.errors.map((error) => <p key={error} className="flex gap-2 text-red-300"><AlertCircle className="mt-0.5 shrink-0" size={14} />{error}</p>)}
      {result.holdings.length > 0 && <button onClick={saveImport} disabled={status === "loading"} className="inline-flex items-center gap-2 rounded-lg bg-brass px-4 py-2 font-medium text-white transition hover:bg-brass-bright disabled:opacity-50">{status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}Import verified rows</button>}
    </div>}
    {message && <p className={`mt-3 text-xs ${status === "error" ? "text-red-300" : "text-brass"}`}>{message}</p>}
    {recent.length > 0 && <p className="mt-4 border-t border-ink-hairline pt-3 text-xs text-paper-muted">Latest import: {recent[0].holdings.length} holdings · {new Date(recent[0].created_at).toLocaleDateString()}</p>}
  </section>;
}
