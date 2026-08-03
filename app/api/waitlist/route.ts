import { NextResponse } from "next/server";
import { createWriteClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { WaitlistSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`waitlist:${ip}`, { maxRequests: 5, windowMs: 60_000 }).success) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  }
  const supabase = createWriteClient();
  if (!supabase) return NextResponse.json({ error: "Waitlist is temporarily unavailable. Please try again later." }, { status: 503 });

  const { error } = await supabase.from("waitlist_signups").insert({
    email: parsed.data.email,
    source: parsed.data.source,
    ip,
    user_agent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This email is already on the waitlist." }, { status: 409 });
    console.error("Waitlist insert failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Could not join the waitlist. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
