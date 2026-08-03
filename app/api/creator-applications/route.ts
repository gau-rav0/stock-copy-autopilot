import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";
import { dispatchOutboundEvent } from "@/lib/outbound";
import { extractPdfText, parseCasText, type ParsedCasHolding } from "@/lib/cas-parser";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { CreatorApplicationSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CreatorPayload = {
  creatorName?: string;
  name?: string;
  email?: string;
  twitter?: string; linkedin?: string; youtube?: string; broker?: string; aum?: string; followers?: string; proof_url?: string; notes?: string;
  method?: "cas" | "manual";
  fileName?: string | null;
  holdingsText?: string;
};

const getPayload = async (request: Request): Promise<CreatorPayload & { file: File | null }> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("casFile");

    return {
      creatorName: String(form.get("creatorName") ?? ""),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      twitter: String(form.get("twitter") ?? ""), linkedin: String(form.get("linkedin") ?? ""), youtube: String(form.get("youtube") ?? ""), broker: String(form.get("broker") ?? ""), aum: String(form.get("aum") ?? ""), followers: String(form.get("followers") ?? ""), proof_url: String(form.get("proof_url") ?? ""), notes: String(form.get("notes") ?? ""),
      method: form.get("method") === "cas" ? "cas" : "manual",
      fileName: file instanceof File ? file.name : null,
      holdingsText: String(form.get("holdingsText") ?? ""),
      file: file instanceof File ? file : null,
    };
  }

  const payload = (await request.json().catch(() => ({}))) as CreatorPayload;
  return { ...payload, file: null };
};

const parsedStatus = (method: CreatorPayload["method"], holdings: ParsedCasHolding[], parseError?: string | null) => {
  if (parseError) {
    return "parse_failed";
  }

  if (holdings.length > 0) {
    return method === "cas" ? "parsed_pending_review" : "manual_parsed_pending_review";
  }

  return method === "cas" ? "needs_manual_review" : "manual_pending_review";
};

async function handlePost(request: Request) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`creator:${ip}`, { maxRequests: 5 });
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const raw = await getPayload(request);
  const validated = CreatorApplicationSchema.safeParse(raw);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const payload = { ...raw, ...validated.data };

  let sourceText = payload.holdingsText ?? "";
  let parseError: string | null = null;

  if (payload.method === "cas" && payload.file) {
    try {
      sourceText = payload.file.type === "application/pdf" || payload.file.name.toLowerCase().endsWith(".pdf")
        ? await extractPdfText(payload.file)
        : await payload.file.text();
    } catch (error) {
      parseError = error instanceof Error ? error.message : "Could not parse uploaded CAS file.";
    }
  }

  const parsed = parseCasText(sourceText);
  const parse_status = parsedStatus(payload.method, parsed.holdings, parseError);
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
        error: "Application storage is temporarily unavailable. Please try again later.",
        reason: "Supabase is not configured.",
        parseStatus: parse_status,
        parsedCount: parsed.holdings.length,
        outbound,
      },
      { status: 503 }
    );
  }

  const { data: existing } = await supabase.from("creator_applications").select("id").eq("email", payload.email).maybeSingle();
  if (existing) return NextResponse.json({ stored: false, error: "An application for this email already exists." }, { status: 409 });

  const insertPayload = {
    creator_name: payload.creatorName || payload.name || null,
    name: payload.name || payload.creatorName || null,
    email: payload.email,
    twitter: payload.twitter || null, linkedin: payload.linkedin || null, youtube: payload.youtube || null,
    broker: payload.broker || null, aum: payload.aum || null, followers: payload.followers || null, proof_url: payload.proof_url || null, notes: payload.notes || null,
    method: payload.method,
    cas_file_name: payload.fileName || null,
    holdings_text: sourceText || payload.holdingsText || null,
    parsed_holdings: parsed.holdings,
    parsed_warnings: parsed.warnings,
    parse_error: parseError,
    parse_status,
    parsed_at: parsed.holdings.length > 0 ? new Date().toISOString() : null,
    status: "Pending",
  };

  const canUsePrivateWrites = hasSupabaseWriteConfig();
  const { data, error } = canUsePrivateWrites
    ? await supabase.from("creator_applications").insert(insertPayload).select("id").single()
    : await supabase.from("creator_applications").insert(insertPayload);

  if (error) {
    if (error.code === "23505") return NextResponse.json({ stored: false, error: "An application for this email already exists." }, { status: 409 });
    console.error("Creator application insert failed", { code: error.code, message: error.message });
    return NextResponse.json({ stored: false, error: "Could not save your application. Please try again." }, { status: 500 });
  }

  const applicationId = canUsePrivateWrites && data && "id" in data ? data.id : null;

  if (applicationId && parsed.holdings.length > 0) {
    const { error: holdingsError } = await supabase.from("creator_application_holdings").insert(
      parsed.holdings.map((holding) => ({
        application_id: applicationId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        market_value: holding.marketValue,
        weight_pct: holding.weightPct,
        confidence: holding.confidence,
        source_line: holding.sourceLine,
      }))
    );
    if (holdingsError) {
      console.error("Creator holdings insert failed", { applicationId, code: holdingsError.code, message: holdingsError.message });
      return NextResponse.json({ stored: false, error: "Application was received but its holdings could not be saved. Please contact support." }, { status: 500 });
    }
  }

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
      { event_type: "creator_application", destination: "crm", status: outbound.crm, payload: { applicationId } },
      { event_type: "creator_application", destination: "email", status: outbound.email, payload: { applicationId } },
    ]);
  }

  return NextResponse.json({ stored: true, success: true, parseStatus: parse_status, parsedCount: parsed.holdings.length, outbound }, { status: 201 });
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
      { status: 500 }
    );
  }
}
