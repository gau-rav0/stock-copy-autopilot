import {
  createClient,
  createWriteClient,
  hasSupabaseWriteConfig,
} from "@/lib/supabase/server";
import { dispatchOutboundEvent } from "@/lib/outbound";
import {
  extractPdfText,
  parseCasText,
  type ParsedCasHolding,
} from "@/lib/cas-parser";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { CreatorApplicationSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";

export const runtime = "nodejs";

const existingApplicationResponse = () =>
  NextResponse.json(
    {
      stored: false,
      code: "APPLICATION_EXISTS",
      error:
        "An application for this email is already on file. This upload did not replace it.",
    },
    { status: 409 },
  );

// Only disclose review status for the authenticated user's own email.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const auth = await createClient();
    if (!auth)
      return NextResponse.json(
        { error: "Sign in to view your application." },
        { status: 401, headers },
      );
    const {
      data: { user },
      error: authError,
    } = await auth.auth.getUser();
    if (authError || !user?.email)
      return NextResponse.json(
        { error: "Sign in to view your application." },
        { status: 401, headers },
      );
    const supabase = createWriteClient();
    if (!supabase)
      return NextResponse.json(
        { error: "Application status is temporarily unavailable." },
        { status: 503, headers },
      );
    const { data, error } = await supabase
      .from("creator_applications")
      .select(
        "status,creator_name,evidence_path,evidence_reviewed_at,evidence_review_notes,statement_as_of",
      )
      .ilike("email", user.email.trim().replace(/[\\%_]/g, "\\$&"))
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(
      {
        exists: Boolean(data),
        status: data?.status,
        creatorName: data?.creator_name,
        hasEvidence: Boolean(data?.evidence_path),
        reviewedAt: data?.evidence_reviewed_at,
        reviewNotes: data?.evidence_review_notes,
        statementAsOf: data?.statement_as_of,
        email: user.email,
      },
      { headers },
    );
  } catch (error) {
    console.error("Creator application status lookup failed", error);
    return NextResponse.json(
      { error: "Could not check your application status. Please try again." },
      { status: 503, headers },
    );
  }
}

type CreatorPayload = {
  creatorName?: string;
  name?: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  broker?: string;
  aum?: string;
  followers?: string;
  proof_url?: string;
  notes?: string;
  method?: "cas" | "manual";
  fileName?: string | null;
  holdingsText?: string;
};

const getPayload = async (
  request: Request,
): Promise<CreatorPayload & { file: File | null }> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("casFile");

    return {
      creatorName: String(form.get("creatorName") ?? ""),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      twitter: String(form.get("twitter") ?? ""),
      linkedin: String(form.get("linkedin") ?? ""),
      youtube: String(form.get("youtube") ?? ""),
      broker: String(form.get("broker") ?? ""),
      aum: String(form.get("aum") ?? ""),
      followers: String(form.get("followers") ?? ""),
      proof_url: String(form.get("proof_url") ?? ""),
      notes: String(form.get("notes") ?? ""),
      method: form.get("method") === "cas" ? "cas" : "manual",
      fileName: file instanceof File ? file.name : null,
      holdingsText: String(form.get("holdingsText") ?? ""),
      file: file instanceof File ? file : null,
    };
  }

  const payload = (await request.json().catch(() => ({}))) as CreatorPayload;
  return { ...payload, file: null };
};

const MAX_CAS_FILE_SIZE_BYTES = 4 * 1024 * 1024;

const parsedStatus = (
  method: CreatorPayload["method"],
  holdings: ParsedCasHolding[],
  parseError?: string | null,
) => {
  if (parseError) {
    return "parse_failed";
  }

  if (holdings.length > 0) {
    return method === "cas"
      ? "parsed_pending_review"
      : "manual_parsed_pending_review";
  }

  return method === "cas" ? "needs_manual_review" : "manual_pending_review";
};

async function handlePost(request: Request) {
  if (
    Number(request.headers.get("content-length")) >
    MAX_CAS_FILE_SIZE_BYTES + 100_000
  ) {
    return NextResponse.json(
      { error: "Upload a PDF or text statement smaller than 4 MB." },
      { status: 413 },
    );
  }
  const ip = getClientIp(request);
  const limiter = rateLimit(`creator:${ip}`, { maxRequests: 5 });
  if (!limiter.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const raw = await getPayload(request);
  const validated = CreatorApplicationSchema.safeParse(raw);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const payload = { ...raw, ...validated.data };

  if (payload.file && payload.file.size > MAX_CAS_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "CAS file must be 4 MB or smaller." },
      { status: 400 },
    );
  }

  let ownerUserId: string | null = null;
  let evidenceBytes: Buffer | null = null;
  let evidenceType = "text/plain";
  if (payload.method === "cas") {
    if (!payload.file || payload.file.size === 0)
      return NextResponse.json(
        {
          error:
            "An original PDF or text statement is required for CAS review.",
        },
        { status: 400 },
      );
    const isPdf = /\.pdf$/i.test(payload.file.name);
    if (!isPdf && !/\.txt$/i.test(payload.file.name))
      return NextResponse.json(
        { error: "Use a PDF or text statement." },
        { status: 400 },
      );
    evidenceBytes = Buffer.from(await payload.file.arrayBuffer());
    if (isPdf && evidenceBytes.subarray(0, 5).toString() !== "%PDF-")
      return NextResponse.json(
        { error: "This file is not a valid PDF." },
        { status: 400 },
      );
    if (!isPdf && evidenceBytes.includes(0))
      return NextResponse.json(
        { error: "This file is not a plain-text statement." },
        { status: 400 },
      );
    evidenceType = isPdf ? "application/pdf" : "text/plain";
    const auth = await createClient();
    const user = auth ? (await auth.auth.getUser()).data.user : null;
    if (!user?.email)
      return NextResponse.json(
        {
          code: "SIGN_IN_REQUIRED",
          error: "Sign in before uploading your financial statement.",
        },
        { status: 401 },
      );
    if (user.email.trim().toLowerCase() !== payload.email)
      return NextResponse.json(
        { error: "Use the email address on your signed-in account." },
        { status: 403 },
      );
    ownerUserId = user.id;
  }

  let sourceText = payload.holdingsText ?? "";
  let parseError: string | null = null;

  if (payload.method === "cas" && payload.file) {
    try {
      sourceText =
        payload.file.type === "application/pdf" ||
        payload.file.name.toLowerCase().endsWith(".pdf")
          ? await extractPdfText(payload.file)
          : await payload.file.text();
    } catch (error) {
      parseError =
        error instanceof Error
          ? error.message
          : "Could not parse uploaded CAS file.";
    }
  }

  const parsed = parseCasText(sourceText);
  const parse_status = parsedStatus(
    payload.method,
    parsed.holdings,
    parseError,
  );
  const supabase = createWriteClient();
  if (!supabase) {
    const outbound = await dispatchOutboundEvent("creator_application", {
      creatorName: payload.creatorName || null,
      email: payload.email,
      method: payload.method,
      fileName: payload.fileName || null,
      parseStatus: parse_status,
      parsedHoldings: parsed.holdings,
      parsedWarnings: parsed.warnings,
    });

    return NextResponse.json(
      {
        stored: false,
        error:
          "Application storage is temporarily unavailable. Please try again later.",
        reason: "Supabase is not configured.",
        parseStatus: parse_status,
        parsedCount: parsed.holdings.length,
        outbound,
      },
      { status: 503 },
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("creator_applications")
    .select("id,status,evidence_path")
    .ilike("email", payload.email.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();
  if (lookupError) {
    console.error("Creator application lookup failed", {
      code: lookupError.code,
    });
    return NextResponse.json(
      {
        stored: false,
        error: "Could not check your existing application. Please try again.",
      },
      { status: 503 },
    );
  }
  const updating = request.method === "PATCH";
  if (existing && !updating) return existingApplicationResponse();
  if (
    updating &&
    (!existing ||
      !ownerUserId ||
      payload.method !== "cas" ||
      !["Pending", "Need Proof"].includes(existing.status))
  ) {
    return NextResponse.json(
      {
        error:
          "Sign in with the application email to update a pending statement.",
      },
      { status: 409 },
    );
  }

  let evidencePath: string | null = null;
  if (evidenceBytes && ownerUserId) {
    evidencePath = `${ownerUserId}/${randomUUID()}.${evidenceType === "application/pdf" ? "pdf" : "txt"}`;
    const { error: uploadError } = await supabase.storage
      .from("creator-evidence")
      .upload(evidencePath, evidenceBytes, {
        contentType: evidenceType,
        upsert: false,
      });
    if (uploadError)
      return NextResponse.json(
        {
          stored: false,
          error: "Could not store your statement securely. Please try again.",
        },
        { status: 503 },
      );
  }

  const insertPayload = {
    creator_name: payload.creatorName || payload.name || null,
    name: payload.name || payload.creatorName || null,
    email: payload.email,
    twitter: payload.twitter || null,
    linkedin: payload.linkedin || null,
    youtube: payload.youtube || null,
    broker: payload.broker || null,
    aum: payload.aum || null,
    followers: payload.followers || null,
    proof_url: payload.proof_url || null,
    notes: payload.notes || null,
    method: payload.method,
    cas_file_name: payload.fileName || null,
    holdings_text: payload.method === "manual" ? sourceText || null : null,
    owner_user_id: ownerUserId,
    evidence_path: evidencePath,
    evidence_sha256: evidenceBytes
      ? createHash("sha256").update(evidenceBytes).digest("hex")
      : null,
    evidence_uploaded_at: evidencePath ? new Date().toISOString() : null,
    parsed_holdings: parsed.holdings,
    parsed_warnings: parsed.warnings,
    parse_error: parseError,
    parse_status,
    parsed_at: parsed.holdings.length > 0 ? new Date().toISOString() : null,
    status: "Pending",
    evidence_reviewed_at: null,
    evidence_reviewed_by: null,
    evidence_review_notes: null,
    statement_as_of: null,
  };

  const canUsePrivateWrites = hasSupabaseWriteConfig();
  const { data, error } =
    updating && existing
      ? await supabase
          .from("creator_applications")
          .update(insertPayload)
          .eq("id", existing.id)
          .in("status", ["Pending", "Need Proof"])
          .select("id")
          .single()
      : canUsePrivateWrites
        ? await supabase
            .from("creator_applications")
            .insert(insertPayload)
            .select("id")
            .single()
        : await supabase.from("creator_applications").insert(insertPayload);

  if (error) {
    if (evidencePath)
      await supabase.storage.from("creator-evidence").remove([evidencePath]);
    if (error.code === "23505") return existingApplicationResponse();
    console.error("Creator application insert failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      {
        stored: false,
        error: "Could not save your application. Please try again.",
      },
      { status: 500 },
    );
  }

  const applicationId =
    canUsePrivateWrites && data && "id" in data ? data.id : null;
  if (updating && existing?.evidence_path)
    await supabase.storage
      .from("creator-evidence")
      .remove([existing.evidence_path]);

  const outbound = await dispatchOutboundEvent("creator_application", {
    applicationId,
    creatorName: payload.creatorName || null,
    email: payload.email,
    method: payload.method,
    fileName: payload.fileName || null,
    parseStatus: parse_status,
    parsedCount: parsed.holdings.length,
    parsedWarnings: parsed.warnings,
  });

  if (applicationId) {
    await supabase.from("outbound_deliveries").insert([
      {
        event_type: "creator_application",
        destination: "crm",
        status: outbound.crm,
        payload: { applicationId },
      },
      {
        event_type: "creator_application",
        destination: "email",
        status: outbound.email,
        payload: { applicationId },
      },
    ]);
  }

  return NextResponse.json(
    {
      stored: true,
      success: true,
      updated: updating,
      parseStatus: parse_status,
      parsedCount: parsed.holdings.length,
      outbound,
    },
    { status: updating ? 200 : 201 },
  );
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("Creator application submission failed:", error);
    return NextResponse.json(
      {
        stored: false,
        error: "Could not submit this application. Please try again.",
      },
      { status: 500 },
    );
  }
}

export const PATCH = POST;
