"use client";

import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

export default function CreatorDashboardClient() {
  const [ticker, setTicker] = useState("");
  const [action, setAction] = useState("buy");
  const [allocationBefore, setAllocationBefore] = useState<string>("0");
  const [allocationAfter, setAllocationAfter] = useState<string>("0");
  const [alertText, setAlertText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !alertText) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/creator/broadcast-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          action,
          alertText,
          allocationBefore: parseFloat(allocationBefore) || 0,
          allocationAfter: parseFloat(allocationAfter) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to broadcast alert");
      }

      setStatus("success");
      setMessage("Your conviction alert has been successfully broadcast to your followers.");
      setTicker("");
      setAlertText("");
      setAction("buy");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="ticker" className="text-sm font-medium text-ink">
            Stock Ticker
          </label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g. INFY, HDFCBANK"
            required
            className="w-full rounded-lg border border-white/10 bg-base p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="action" className="text-sm font-medium text-ink">
            Action
          </label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-base p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          >
            <option value="buy">Buy (New Position)</option>
            <option value="add">Add (Increase Allocation)</option>
            <option value="reduce">Reduce (Trim Position)</option>
            <option value="exit">Exit (Full Sell)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="allocationBefore" className="text-sm font-medium text-ink">
            Allocation Before (%)
          </label>
          <input
            id="allocationBefore"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={allocationBefore}
            onChange={(e) => setAllocationBefore(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-base p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="allocationAfter" className="text-sm font-medium text-ink">
            Allocation After (%)
          </label>
          <input
            id="allocationAfter"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={allocationAfter}
            onChange={(e) => setAllocationAfter(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-base p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="alertText" className="text-sm font-medium text-ink">
          Explanation / Conviction Text
        </label>
        <textarea
          id="alertText"
          value={alertText}
          onChange={(e) => setAlertText(e.target.value)}
          placeholder="Why are you making this move? Explain your conviction to your followers..."
          required
          rows={4}
          className="w-full resize-y rounded-lg border border-white/10 bg-base p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || !ticker || !alertText}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brass px-6 py-3 font-medium text-base shadow-sm hover:bg-brass/90 disabled:opacity-50"
      >
        {status === "loading" ? (
          "Broadcasting..."
        ) : (
          <>
            <Send className="h-5 w-5" />
            Broadcast Alert to Followers
          </>
        )}
      </button>
    </form>
  );
}
