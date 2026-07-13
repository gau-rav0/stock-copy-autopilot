"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";

export default function NotificationPreferences() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setEnabled(data.tradeAlertsEmail ?? true))
      .catch(() => setMessage("Could not load your alert preference."))
      .finally(() => setLoading(false));
  }, []);

  const update = async () => {
    const next = !enabled;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tradeAlertsEmail: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update your alert preference.");
      setEnabled(data.tradeAlertsEmail);
      setMessage(data.tradeAlertsEmail ? "Trade alerts are on." : "Trade alerts are off.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your alert preference.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-lg border border-brass/30 bg-brass/10 p-2 text-brass"><Bell size={18} /></div>
          <div>
            <h2 className="font-display text-lg text-paper">Email trade alerts</h2>
            <p className="mt-1 text-sm leading-5 text-paper-muted">Receive creator activity updates at the email address on your FVI account.</p>
          </div>
        </div>
        <button onClick={update} disabled={loading || saving} aria-pressed={enabled} className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-brass" : "bg-ink-hairline"} disabled:opacity-50`}>
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`}>{saving && <Loader2 size={12} className="m-1.5 animate-spin text-ink" />}</span>
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-paper-muted">{message}</p>}
    </section>
  );
}
