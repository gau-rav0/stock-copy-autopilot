import { NextResponse } from "next/server";
import { z } from "zod";
import { parsePortfolioCsv } from "@/lib/portfolio-import";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const ImportSchema = z.object({
  csv: z.string().min(1, "Choose a CSV file.").max(1_000_000, "CSV files must be under 1 MB."),
  broker: z.enum(["zerodha", "upstox", "angelone", "groww", "other"]).optional(),
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("portfolio_imports")
    .select("id, source, broker, status, holdings, errors, duplicates, missing_symbols, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return NextResponse.json({ error: "Could not load imports." }, { status: 500 });
  return NextResponse.json({ imports: data ?? [] });
}

export async function POST(request: Request) {
  if (!rateLimit(`portfolio-import:${getClientIp(request)}`, { maxRequests: 10 }).success) {
    return NextResponse.json({ error: "Too many imports. Try again in a minute." }, { status: 429 });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = ImportSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });

  const result = parsePortfolioCsv(parsed.data.csv);
  const status = result.holdings.length > 0 ? (result.errors.length ? "completed_with_errors" : "completed") : "failed";
  const { data, error } = await supabase
    .from("portfolio_imports")
    .insert({
      user_id: user.id,
      source: "csv",
      broker: parsed.data.broker ?? null,
      status,
      holdings: result.holdings,
      errors: result.errors,
      duplicates: result.duplicates,
      missing_symbols: result.missingSymbols,
    })
    .select("id, source, broker, status, holdings, errors, duplicates, missing_symbols, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Could not save this import. Please try again." }, { status: 500 });
  return NextResponse.json({ import: data, result }, { status: status === "failed" ? 422 : 201 });
}
