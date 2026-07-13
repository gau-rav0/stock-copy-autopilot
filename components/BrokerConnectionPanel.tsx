"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Link2, Loader2, ShieldCheck } from "lucide-react";

type Purpose = "creator" | "follower";
type Connection = {
  id: string;
  broker: string;
  purpose: Purpose;
  account_label: string | null;
  status: string;
};

const BROKERS = [
  ["zerodha", "Zerodha"],
  ["upstox", "Upstox"],
  ["angelone", "Angel One"],
  ["groww", "Groww"],
  ["other", "Other broker"],
] as const;

export default function BrokerConnectionPanel({ purpose }: { purpose: Purpose }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [broker, setBroker] = useState<(typeof BROKERS)[number][0]>("zerodha");
  const [accountLabel, setAccountLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/broker-connections")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => undefined);
  }, []);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/broker-connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ broker, purpose, accountLabel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the broker connection.");
      setConnections((current) => [
        ...current.filter((connection) => !(connection.broker === data.connection.broker && connection.purpose === purpose)),
        data.connection,
      ]);
      setStatus("success");
      setMessage("Connection request saved. Complete provider authorization before trade data can flow.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save the broker connection.");
    }
  };

  const relevantConnections = connections.filter((connection) => connection.purpose === purpose);
  const heading = purpose === "creator" ? "Connect your read-only trade feed" : "Broker connection (optional)";
  const description = purpose === "creator"
    ? "A verified provider connection can send your completed trades to followers as alerts. We never request order placement rights."
    : "Your email is all that is needed for trade alerts. Broker linking is optional and never enables copy trading or order placement.";

  return (
    <section className="rounded-xl border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
      <div className="flex gap-3">
        <div className="mt-0.5 rounded-lg border border-brass/30 bg-brass/10 p-2 text-brass"><ShieldCheck size={18} /></div>
        <div>
          <h2 className="font-display text-lg text-paper">{heading}</h2>
          <p className="mt-1 text-sm leading-5 text-paper-muted">{description}</p>
        </div>
      </div>

      {relevantConnections.length > 0 && (
        <div className="mt-4 space-y-2">
          {relevantConnections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between rounded-lg border border-ink-hairline px-3 py-2 text-sm">
              <span className="text-paper">{BROKERS.find(([value]) => value === connection.broker)?.[1] ?? connection.broker}{connection.account_label ? ` · ${connection.account_label}` : ""}</span>
              <span className="font-mono text-[10px] uppercase text-brass">{connection.status.replaceAll("_", " ")}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={connect} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select value={broker} onChange={(event) => setBroker(event.target.value as typeof broker)} className="input-field">
          {BROKERS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <input value={accountLabel} onChange={(event) => setAccountLabel(event.target.value)} maxLength={80} placeholder="Account label (optional)" className="input-field" />
        <button type="submit" disabled={status === "loading"} className="inline-flex items-center justify-center gap-2 rounded-lg border border-brass/40 px-4 py-2 text-sm font-medium text-brass transition hover:border-brass disabled:opacity-50">
          {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
          Connect
        </button>
      </form>
      {message && <p className={`mt-3 flex items-center gap-2 text-xs ${status === "error" ? "text-red-300" : "text-brass"}`}>{status === "success" && <CheckCircle2 size={14} />}{message}</p>}
      <p className="mt-3 text-xs text-paper-muted">No broker password, API key, token, or trading permission is stored by FVI.</p>
    </section>
  );
}
