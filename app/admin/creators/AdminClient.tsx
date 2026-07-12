"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

type Application = {
  id: string;
  email: string;
  creator_name: string;
  social_links: any;
  status: string;
  created_at: string;
};

export default function AdminClient({ applications }: { applications: Application[] }) {
  const [apps, setApps] = useState(applications);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/approve-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");

      // Optimistically update
      setApps((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "approved" } : app))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-loss/20 bg-loss/10 p-4 text-sm text-loss">
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-lg border border-ink-hairline bg-surface/50 p-8 text-center text-paper-muted">
          No applications found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink-hairline bg-surface/50 shadow-sm">
          <table className="w-full text-left text-sm text-paper">
            <thead className="bg-ink-elevated/50 text-paper-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Creator</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-hairline">
              {apps.map((app) => (
                <tr key={app.id} className="transition hover:bg-white/[.02]">
                  <td className="px-6 py-4">
                    <div className="font-medium">{app.creator_name || "N/A"}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-paper-muted">
                      <Mail size={12} /> {app.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        app.status === "approved"
                          ? "bg-gain/10 text-gain"
                          : "bg-brass/10 text-brass"
                      }`}
                    >
                      {app.status === "approved" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-paper-muted">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === "pending_review" && (
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={loading === app.id}
                        className="rounded bg-brass px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brass-bright disabled:opacity-50"
                      >
                        {loading === app.id ? "Approving..." : "Approve & Create Profile"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
