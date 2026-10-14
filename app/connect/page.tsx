"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { existingApplicationMessage } from "@/lib/creator-application-status";
import { trackEvent } from "@/lib/product-events";
type Application = {
  exists?: boolean;
  status?: string;
  email?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  creatorName?: string;
  hasEvidence?: boolean;
};
type Method = "cas" | "manual";
export default function ConnectPage() {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [method, setMethod] = useState<Method | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [holdings, setHoldings] = useState("");
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [done, setDone] = useState<"saved" | "existing" | null>(null);
  const [application, setApplication] = useState<Application>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12000);
    fetch("/api/creator-applications", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) return;
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!active) return;
        setApplication(data);
        if (data.creatorName) setName(data.creatorName);
        if (data.email) setEmail(data.email);
        if (data.exists) {
          setDone("existing");
          trackEvent("application_existing");
        }
      })
      .catch(() => {
        if (active)
          setStatusNote(
            "We couldn’t load your application status. Refresh to check it, or continue; an application already on file will be preserved.",
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || !method) return;
    setError("");
    if (method === "cas" && !file) {
      setError("Choose an original PDF or text statement.");
      return;
    }
    if (
      file &&
      method === "cas" &&
      (file.size > 4 * 1024 * 1024 ||
        file.size === 0 ||
        !/\.(pdf|txt)$/i.test(file.name))
    ) {
      setError("Use a non-empty PDF or text statement, 4 MB or smaller.");
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("creatorName", name);
      form.set("name", name);
      form.set(
        "email",
        (method === "cas" ? (user?.email ?? email) : email).trim(),
      );
      form.set("method", method);
      form.set("holdingsText", holdings);
      Object.entries(details).forEach(([key, value]) => form.set(key, value));
      if (method === "cas" && file) form.set("casFile", file);
      const res = await fetch("/api/creator-applications", {
        method: updating ? "PATCH" : "POST",
        body: form,
        signal: AbortSignal.timeout(45000),
      });
      const json = await res.json();
      if (res.status === 409 && json.code === "APPLICATION_EXISTS") {
        setDone("existing");
        setApplication({});
        trackEvent("application_existing");
        return;
      }
      if (!res.ok || !json.stored)
        throw new Error(
          json.error || "Could not save your application. Please try again.",
        );
      setDone("saved");
      trackEvent("application_success");
    } catch (err) {
      setError(
        err instanceof Error && err.name !== "TimeoutError"
          ? err.message
          : "This upload is taking longer than expected. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  function choose(next: Method) {
    setMethod(next);
    setError("");
    trackEvent("creator_started");
  }
  const field = (key: string, label: string, type = "text") => (
    <label key={key}>
      <span className="field-label">{label}</span>
      <input
        type={type}
        className="input-field"
        value={details[key] || ""}
        onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
        maxLength={key === "notes" ? 5000 : 300}
      />
    </label>
  );
  return (
    <section className="page-shell onboarding-layout">
      <p className="eyebrow">For creators / Founding cohort</p>
      <h1>
        Let your evidence
        <br />
        do the talking.
      </h1>
      <p className="onboarding-intro">
        Submit your portfolio for human review. Your statement stays private;
        you choose what to publish. We never request trading permissions.
      </p>
      <nav aria-label="Application progress" className="step-nav">
        <span aria-current={!method && !done ? "step" : undefined}>
          01 / Method
        </span>
        <span aria-current={method && !done ? "step" : undefined}>
          02 / Evidence
        </span>
        <span aria-current={done ? "step" : undefined}>03 / Status</span>
      </nav>
      {checking ? (
        <p role="status" className="notice">
          Checking your application status…
        </p>
      ) : done ? (
        <div className="done-panel" role="status">
          <CheckCircle2 size={27} className="text-gain" />
          <h2>
            {done === "saved"
              ? "Application received."
              : "Application already on file."}
          </h2>
          <p>
            {done === "saved"
              ? "Your submission is saved for review. Parsing helps the reviewer; it does not automatically verify your profile."
              : existingApplicationMessage(application.status)}
          </p>
          {application.reviewNotes && (
            <div className="notice mt-5">
              <strong>Reviewer notes</strong>
              <p>{application.reviewNotes}</p>
            </div>
          )}
          {application.reviewedAt && (
            <p className="mt-4">
              Reviewed{" "}
              {new Date(application.reviewedAt).toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              .
            </p>
          )}
          <div className="hero-actions">
            <Link
              className="button-primary"
              href={
                application.status === "Accepted"
                  ? "/creator/dashboard"
                  : user
                    ? "/dashboard"
                    : "/auth?next=%2Fconnect"
              }
            >
              {application.status === "Accepted"
                ? "Open creator dashboard"
                : user
                  ? "Open my account"
                  : "Sign in to check status"}
              <ArrowUpRight size={16} />
            </Link>
            <a
              className="text-link"
              href="mailto:gauravbihanigb@gmail.com?subject=Creator%20application%20help"
            >
              Contact the reviewer
            </a>
          </div>
          {user &&
            ["Pending", "Need Proof"].includes(application.status || "") && (
              <button
                className="button-secondary mt-5"
                onClick={() => {
                  setDone(null);
                  setMethod("cas");
                  setUpdating(true);
                }}
              >
                Update private statement
              </button>
            )}
          <p className="form-help mt-5">
            Use your application email for review questions or updated proof. An
            additional upload does not replace an existing submission.
          </p>
        </div>
      ) : (
        <>
          {statusNote && (
            <p className="notice mb-5" role="status">
              {statusNote}
            </p>
          )}
          {!method ? (
            <>
              <button className="method-card" onClick={() => choose("cas")}>
                <strong className="flex items-center gap-3">
                  <FileText size={20} className="text-gain" />
                  Submit a statement
                </strong>
                <p>
                  A CDSL/NSDL CAS or broker statement. Sign in before sharing
                  financial evidence. PDF or plain text, up to 4 MB.
                </p>
              </button>
              <button className="method-card" onClick={() => choose("manual")}>
                <strong>Start with manual holdings</strong>
                <p>
                  Enter allocations to begin. A manual submission stays
                  unverified until original evidence is reviewed.
                </p>
              </button>
              <p className="form-help mt-6">
                Broker sync is not enabled.{" "}
                <Link
                  href="/verification"
                  className="underline underline-offset-4"
                >
                  Read the review methodology.
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                className="text-link mb-5"
                onClick={() => {
                  setMethod(null);
                  setError("");
                }}
              >
                <ArrowLeft size={15} />
                Change method
              </button>
              {method === "cas" && !user && !authLoading ? (
                <div className="done-panel">
                  <h2>Sign in before sharing a statement.</h2>
                  <p>
                    We bind the evidence to your account and keep the original
                    in private storage for the reviewer.
                  </p>
                  <Link
                    href="/auth?next=%2Fconnect"
                    className="button-primary mt-6"
                  >
                    Continue with email <ArrowUpRight size={16} />
                  </Link>
                </div>
              ) : authLoading ? (
                <p role="status">Checking your account…</p>
              ) : (
                <form onSubmit={submit} className="creator-form">
                  <div className="form-grid">
                    <label>
                      <span className="field-label">Creator name</span>
                      <input
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                      />
                    </label>
                    <label>
                      <span className="field-label">Application email</span>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        readOnly={method === "cas" && Boolean(user)}
                        maxLength={200}
                        value={
                          email || (method === "cas" ? (user?.email ?? "") : "")
                        }
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                      />
                    </label>
                    <div className="full-width">
                      {method === "cas" ? (
                        <div className="upload-area">
                          <label>
                            <span className="field-label">
                              Original statement / PDF or text · 4 MB maximum
                            </span>
                            <input
                              type="file"
                              required
                              accept=".pdf,.txt,application/pdf,text/plain"
                              onChange={(e) => {
                                setFile(e.target.files?.[0] ?? null);
                                setError("");
                              }}
                            />
                          </label>
                          <p className="form-help mt-4">
                            Upload a redacted copy if appropriate; FVI does not
                            automatically redact the original. Keep the
                            holdings, account owner and statement date readable.
                            Do not include passwords.
                          </p>
                        </div>
                      ) : (
                        <label>
                          <span className="field-label">
                            Holdings / one allocation per line
                          </span>
                          <textarea
                            required
                            className="input-field"
                            rows={6}
                            maxLength={50000}
                            value={holdings}
                            onChange={(e) => setHoldings(e.target.value)}
                            placeholder={"INFY, 14%\nHDFCBANK, 22%"}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <details className="optional-details">
                    <summary>
                      Profile links & reviewer context / optional
                    </summary>
                    <div className="form-grid">
                      {field("twitter", "X / Twitter URL", "url")}
                      {field("linkedin", "LinkedIn URL", "url")}
                      {field("youtube", "YouTube URL", "url")}
                      {field("broker", "Broker")}
                      <label className="full-width">
                        <span className="field-label">
                          Notes for the reviewer
                        </span>
                        <textarea
                          className="input-field"
                          value={details.notes || ""}
                          maxLength={5000}
                          onChange={(e) =>
                            setDetails({ ...details, notes: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  </details>
                  {error && (
                    <p role="alert" className="notice notice-error mb-5">
                      {error}
                    </p>
                  )}
                  <button
                    className="button-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving your application…" : "Submit for review"}
                    <ArrowUpRight size={16} />
                  </button>
                  <p className="form-help mt-5">
                    Original documents are private. Parsed holdings and review
                    details are stored for this application.{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-4"
                    >
                      Privacy & deletion
                    </Link>
                  </p>
                </form>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
