"use client";

import { useState } from "react";
import TrustNotice from "@/components/TrustNotice";

type Step = "method" | "details" | "done";
type Method = "cas" | "manual" | null;

export default function ConnectPage() {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<Method>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [casFile, setCasFile] = useState<File | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [email, setEmail] = useState("");
  const [holdingsText, setHoldingsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  const submitApplication = async () => {
    setSaving(true);
    setSaveNote("");

    try {
      const formData = new FormData();
      formData.set("creatorName", creatorName);
      formData.set("email", email);
      formData.set("method", method ?? "");
      formData.set("holdingsText", holdingsText);
      if (casFile) {
        formData.set("casFile", casFile);
      }

      const response = await fetch("/api/creator-applications", {
        method: "POST",
        body: formData,
      });
      
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(json.error || "Failed to submit application");
      }

      const parseNote = json.parsedCount
        ? `${json.parsedCount} holding${json.parsedCount === 1 ? "" : "s"} parsed for reviewer checks.`
        : "No holdings were parsed automatically; reviewer checks are required.";
      
      setSaveNote(`Application saved for review. ${parseNote}`);
      setStep("done");
    } catch (err: any) {
      setSaveNote(err.message || "An unexpected error occurred. Please try again.");
      setStep("done");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mobile-safe mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Creator onboarding</p>
      <h1 className="mt-3 font-display text-3xl text-paper">Verify your portfolio</h1>
      <p className="mt-3 text-paper-muted">
        We never request trading permissions and can never place trades on your behalf. This is
        read-only, for display purposes only.
      </p>

      <div className="mt-6">
        <TrustNotice
          compact
          items={[
            "Read-only display.",
            "No trading permission.",
            "No broker sync until ToS and SEBI review.",
            "You choose what to publish.",
          ]}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs text-paper-muted">
        {["01 Method", "02 Details", "03 Done"].map((label, i) => (
          <span
            key={label}
            className={`rounded-full border px-3 py-1 ${
              (step === "method" && i === 0) ||
              (step === "details" && i === 1) ||
              (step === "done" && i === 2)
                ? "border-brass text-brass"
                : "border-ink-hairline"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {step === "method" && (
        <div className="mt-8 space-y-4">
          <button
            aria-label="Upload CAS statement"
            onClick={() => {
              setMethod("cas");
              setStep("details");
            }}
            className="w-full rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 text-left shadow-[0_0_50px_rgba(0,157,85,.04)] backdrop-blur transition hover:border-brass/40 hover:shadow-[0_0_70px_rgba(0,157,85,.08)]"
          >
            <p className="font-display text-lg text-paper">Upload CAS statement</p>
            <p className="mt-1 text-sm text-paper-muted">
              Your Consolidated Account Statement from NSDL, CDSL, or your broker. We read your
              holdings from it; nothing is executed and nothing is modified.
            </p>
          </button>
          <button
            aria-label="Enter holdings manually"
            onClick={() => {
              setMethod("manual");
              setStep("details");
            }}
            className="w-full rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 text-left shadow-[0_0_50px_rgba(0,157,85,.04)] backdrop-blur transition hover:border-brass/40 hover:shadow-[0_0_70px_rgba(0,157,85,.08)]"
          >
            <p className="font-display text-lg text-paper">Enter holdings manually</p>
            <p className="mt-1 text-sm text-paper-muted">
              Faster to start, but your profile is shown as unverified until a CAS or
              broker-linked check is added.
            </p>
          </button>
          <p className="pt-2 text-xs text-paper-muted">
            Broker read-only sync is on the roadmap and pending review of each broker's terms of
            service. It is not available in this build.
          </p>
          <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 backdrop-blur">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
              Privacy model
            </p>
            <p className="mt-2 text-sm text-paper-muted">
              CAS upload is intended for semi-manual verification, manual entry remains marked as
              unverified, and broker sync stays disabled until legal and ToS checks are done.
            </p>
          </div>
        </div>
      )}

      {step === "details" && method === "cas" && (
        <div className="mt-8">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <input
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Creator name"
              className="input-field"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Review email"
              className="input-field"
            />
          </div>
          <label className="block rounded-lg border border-dashed border-ink-hairline bg-ink-elevated/75 p-10 text-center shadow-[0_0_60px_rgba(0,157,85,.05)] backdrop-blur transition hover:border-brass/40">
            <input
              type="file"
              accept="application/pdf,text/plain,.pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setCasFile(file);
                setFileName(file?.name ?? null);
              }}
            />
            <p className="text-paper">{fileName ?? "Click to upload your CAS PDF"}</p>
            <p className="mt-1 text-xs text-paper-muted">
              We parse recognizable equity rows for reviewer checks. The profile stays pending
              until evidence is manually approved.
            </p>
          </label>
          <button
            disabled={!fileName || !email || saving}
            onClick={submitApplication}
            className="mt-6 w-full rounded-lg bg-brass px-6 py-3 text-sm font-semibold text-white shadow-[0_0_38px_rgba(0,157,85,.18)] transition hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Submit for review"}
          </button>
        </div>
      )}

      {step === "details" && method === "manual" && (
        <div className="mt-8">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <input
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Creator name"
              className="input-field"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Review email"
              className="input-field"
            />
          </div>
          <label className="text-sm text-paper-muted">
            Paste holdings, one per line, e.g. <span className="font-mono">INFY, 14%</span>
          </label>
          <textarea
            value={holdingsText}
            onChange={(e) => setHoldingsText(e.target.value)}
            rows={6}
            placeholder={"INFY, 14%\nTCS, 13.2%\nBAJFINANCE, 12.5%"}
            className="mt-2 w-full rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 font-mono text-sm text-paper outline-none backdrop-blur focus:border-brass/40"
          />
          <button
            disabled={holdingsText.trim().length === 0 || !email || saving}
            onClick={submitApplication}
            className="mt-6 w-full rounded-lg bg-brass px-6 py-3 text-sm font-semibold text-white shadow-[0_0_38px_rgba(0,157,85,.18)] transition hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Submit application"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-10 rounded-lg border border-brass/30 bg-ink-elevated/75 p-8 text-center shadow-[0_0_70px_rgba(0,157,85,.08)] backdrop-blur-xl">
          <p className="font-display text-xl text-paper">Application received</p>
          <p className="mt-2 text-sm text-paper-muted">
            {method === "cas"
              ? "Marked as pending CAS verification until statement evidence is reviewed."
              : "Marked as pending manual review until CAS or broker verification is added."}
          </p>
          {saveNote ? <p className="mt-3 text-sm text-brass">{saveNote}</p> : null}
          <p className="mt-4 text-xs text-paper-muted">
            We can never trade or place orders on your behalf. Read access only, and only what you
            choose to publish.
          </p>
        </div>
      )}
    </section>
  );
}
