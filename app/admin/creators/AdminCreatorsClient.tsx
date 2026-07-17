"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminCreatorsClient({ initialApplications }: { initialApplications: any[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/approve-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve application");
      }
      
      // Remove approved application from list
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface/50 p-8 text-center text-ink/70">
        No pending applications to review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      
      {applications.map((app) => (
        <div key={app.id} className="rounded-xl border border-white/10 bg-surface/50 p-6 transition-colors hover:border-white/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium text-paper">{app.creator_name}</h3>
              <p className="text-sm text-ink/70">{app.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-ink">
                  Method: {app.method}
                </span>
                <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                  {app.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-ink">
                  Parse: {app.parse_status || "not_parsed"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleExpand(app.id)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-white/5 hover:text-paper"
              >
                {expandedId === app.id ? (
                  <>Hide Details <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>View Details <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
              
              <button
                onClick={() => handleApprove(app.id)}
                disabled={approvingId === app.id}
                className="flex items-center gap-2 rounded-lg bg-brass px-4 py-2 text-sm font-medium text-base shadow-sm hover:bg-brass/90 disabled:opacity-50"
              >
                {approvingId === app.id ? (
                  "Approving..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Publish reviewed profile
                  </>
                )}
              </button>
            </div>
          </div>
          
          {expandedId === app.id && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="mb-4 rounded-lg border border-amber-300/25 bg-amber-300/[.06] p-4 text-sm leading-6 text-amber-100">
                CAS applications with successfully parsed holdings publish as CAS reviewed. Manual or failed parses publish as unverified. Confirm the evidence before publishing.
              </div>
              <h4 className="mb-3 text-sm font-medium text-ink">Parsed Holdings Data:</h4>
              <div className="rounded-lg bg-base p-4 overflow-x-auto">
                <pre className="text-xs text-ink/80">
                  {JSON.stringify(app.parsed_holdings, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
