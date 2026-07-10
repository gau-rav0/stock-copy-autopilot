import { createWriteClient } from "@/lib/supabase/server";
import { dispatchOutboundEvent } from "@/lib/outbound";
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

  const outboundPayload = {
    investorId: payload.investorId ?? null,
    investorName: payload.investorName ?? null,
    email: payload.email ?? null,
    source: payload.source ?? "follow_button",
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
