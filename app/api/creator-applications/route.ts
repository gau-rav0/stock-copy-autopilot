import { createWriteClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    creatorName?: string;
    email?: string;
    method?: "cas" | "manual";
    fileName?: string | null;
    holdingsText?: string;
  };

  if (!payload.email || !payload.method) {
    return NextResponse.json({ error: "Email and verification method are required." }, { status: 400 });
  }

  const supabase = createWriteClient();
  if (!supabase) {
    return NextResponse.json({ stored: false, reason: "Supabase is not configured." });
  }

  const { error } = await supabase.from("creator_applications").insert({
    creator_name: payload.creatorName || null,
    email: payload.email,
    method: payload.method,
    cas_file_name: payload.fileName || null,
    holdings_text: payload.holdingsText || null,
    status: "pending_review",
  });

  if (error) {
    return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stored: true });
}
