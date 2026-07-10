import { createWriteClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    investorId?: string;
    investorName?: string;
    email?: string;
    source?: string;
  };

  if (!payload.investorName && !payload.investorId) {
    return NextResponse.json({ error: "Investor is required." }, { status: 400 });
  }

  const supabase = createWriteClient();
  if (!supabase) {
    return NextResponse.json({ stored: false, reason: "Supabase is not configured." });
  }

  const { error } = await supabase.from("follow_intents").insert({
    investor_slug: payload.investorId ?? null,
    investor_name: payload.investorName ?? null,
    email: payload.email ?? null,
    source: payload.source ?? "follow_button",
  });

  if (error) {
    return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stored: true });
}
