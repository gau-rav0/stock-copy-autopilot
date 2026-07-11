import { createWriteClient } from "@/lib/supabase/server";
import { dispatchOutboundEvent } from "@/lib/outbound";
import { FollowIntentSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = FollowIntentSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  const outboundPayload = {
    investorId: payload.investorId ?? null,
    investorName: payload.investorName ?? null,
    email: payload.email ?? null,
    source: payload.source,
  };

  const supabase = createWriteClient();
  if (!supabase) {
    const outbound = await dispatchOutboundEvent("follow_intent", outboundPayload);
    return NextResponse.json({ stored: false, reason: "Supabase is not configured.", outbound });
  }

  const { error } = await supabase.from("follow_intents").insert({
    investor_slug: outboundPayload.investorId,
    investor_name: outboundPayload.investorName,
    email: outboundPayload.email,
    source: outboundPayload.source,
  });

  if (error) {
    return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  }

  const outbound = await dispatchOutboundEvent("follow_intent", outboundPayload);
  await supabase.from("outbound_deliveries").insert([
    { event_type: "follow_intent", destination: "crm", status: outbound.crm, payload: outboundPayload },
    { event_type: "follow_intent", destination: "email", status: outbound.email, payload: outboundPayload },
  ]);

  return NextResponse.json({ stored: true, outbound });
}
