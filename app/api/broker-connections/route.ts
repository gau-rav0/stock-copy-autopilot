import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BrokerConnectionSchema = z.object({
  broker: z.enum(["zerodha", "upstox", "angelone", "groww", "other"]),
  purpose: z.enum(["creator", "follower"]),
  accountLabel: z.string().trim().max(80).optional().default(""),
});

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("broker_connections")
    .select("id, broker, purpose, account_label, status, last_synced_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connections: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BrokerConnectionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  }

  const { broker, purpose, accountLabel } = parsed.data;
  if (purpose === "creator") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, verified")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.verified) {
      return NextResponse.json({ error: "Only verified creators can connect a read-only trade feed." }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("broker_connections")
    .upsert(
      {
        user_id: user.id,
        broker,
        purpose,
        account_label: accountLabel || null,
        // A provider OAuth callback or a verified server-to-server setup is the only path to active.
        status: "awaiting_authorization",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,broker,purpose" }
    )
    .select("id, broker, purpose, account_label, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: data });
}
