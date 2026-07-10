import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";
import { dispatchOutboundEvent } from "@/lib/outbound";
import { extractPdfText, parseCasText, type ParsedCasHolding } from "@/lib/cas-parser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CreatorPayload = {
  creatorName?: string;
  email?: string;
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
      email: String(form.get("email") ?? ""),
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

export async function POST(request: Request) {
  const payload = await getPayload(request);

  if (!payload.email || !payload.method) {
    return NextResponse.json({ error: "Email and verification method are required." }, { status: 400 });
  }

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

    return NextResponse.json({
      stored: false,
      reason: "Supabase is not configured.",
      parseStatus: parse_status,
      parsedCount: parsed.holdings.length,
      outbound,
    });
  }

  const insertPayload = {
    creator_name: payload.creatorName || null,
    email: payload.email,
    method: payload.method,
    cas_file_name: payload.fileName || null,
    holdings_text: sourceText || payload.holdingsText || null,
    parsed_holdings: parsed.holdings,
    parsed_warnings: parsed.warnings,
    parse_error: parseError,
    parse_status,
    parsed_at: parsed.holdings.length > 0 ? new Date().toISOString() : null,
    status: "pending_review",
  };

  const canUsePrivateWrites = hasSupabaseWriteConfig();
  const { data, error } = canUsePrivateWrites
    ? await supabase.from("creator_applications").insert(insertPayload).select("id").single()
    : await supabase.from("creator_applications").insert(insertPayload);

  if (error) {
    return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  }

  const applicationId = canUsePrivateWrites && data && "id" in data ? data.id : null;

  if (applicationId && parsed.holdings.length > 0) {
    await supabase.from("creator_application_holdings").insert(
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

  return NextResponse.json({ stored: true, parseStatus: parse_status, parsedCount: parsed.holdings.length, outbound });
}
