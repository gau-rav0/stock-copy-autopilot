"use client";
import { useState } from "react";
type Application = {
  id: string;
  creator_name: string;
  email: string;
  method: string;
  parse_status: string;
  parsed_holdings: unknown;
  evidence_path: string | null;
  evidence_sha256: string | null;
};
export default function AdminCreatorsClient({
  initialApplications,
}: {
  initialApplications: Application[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [opened, setOpened] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function select(id: string) {
    setSelected(selected === id ? null : id);
    setNotes("");
    setDate("");
    setConfirmed(false);
    setOpened(false);
    setUrl("");
    setError("");
  }
  async function evidence(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/creator-evidence?id=${id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the evidence.");
    } finally {
      setBusy(false);
    }
  }
  async function approve(application: Application) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/approve-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          evidenceConfirmed: confirmed && opened,
          reviewNotes: notes,
          statementAsOf: date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplications((current) =>
        current.filter((a) => a.id !== application.id),
      );
      setSelected(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not publish this profile.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!applications.length)
    return <p className="notice">No pending applications to review.</p>;
  return (
    <div>
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      {applications.map((app) => (
        <section key={app.id} className="review-panel">
          <div className="panel-heading">
            <div>
              <h2>{app.creator_name || "Creator application"}</h2>
              <p className="form-help mt-2">
                {app.email} ·{" "}
                {app.method === "cas"
                  ? "Statement review"
                  : "Manual holdings / unverified"}
              </p>
            </div>
            <button
              className="button-secondary"
              aria-expanded={selected === app.id}
              onClick={() => select(app.id)}
            >
              {selected === app.id ? "Close review" : "Review application"}
            </button>
          </div>
          {selected === app.id && (
            <>
              <p className="notice">
                A parser result is not verification. Inspect the original, match
                account ownership and published holdings, and record the
                statement date before issuing a CAS badge.
              </p>
              {app.method === "cas" && (
                <div className="mt-5">
                  {app.evidence_path ? (
                    <>
                      <button
                        className="button-secondary"
                        disabled={busy}
                        onClick={() => void evidence(app.id)}
                      >
                        Prepare original statement link
                      </button>
                      {url && (
                        <p className="mt-4">
                          <a
                            className="text-link underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpened(true)}
                          >
                            Open original statement / link expires in 60 seconds
                          </a>
                        </p>
                      )}
                      <p className="form-help mt-3 break-all">
                        SHA-256: {app.evidence_sha256}
                      </p>
                    </>
                  ) : (
                    <p className="notice notice-error">
                      No original evidence on file. Contact the applicant for a
                      fresh submission; this application cannot receive a CAS
                      badge.
                    </p>
                  )}
                </div>
              )}
              <details className="import-details">
                <summary>Parsed holdings / {app.parse_status}</summary>
                <pre className="mt-4">
                  {JSON.stringify(app.parsed_holdings, null, 2)}
                </pre>
              </details>
              <div className="form-grid">
                <label className="full-width">
                  <span className="field-label">
                    Review notes / visible to the applicant
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field"
                    maxLength={3000}
                  />
                </label>
                {app.method === "cas" && (
                  <label>
                    <span className="field-label">Statement as of</span>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-field"
                    />
                  </label>
                )}
              </div>
              {app.method === "cas" && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    disabled={!opened}
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>
                    I reviewed the original, matched its owner to the
                    application, and checked the holdings against the statement.
                  </span>
                </label>
              )}
              <button
                onClick={() => void approve(app)}
                disabled={
                  busy ||
                  (app.method === "cas" &&
                    (!confirmed ||
                      !opened ||
                      !date ||
                      notes.trim().length < 10))
                }
                className="button-primary mt-5"
              >
                {busy
                  ? "Saving review…"
                  : app.method === "cas"
                    ? "Publish with CAS review label"
                    : "Publish as unverified"}
              </button>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
