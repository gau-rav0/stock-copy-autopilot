import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";

function validSignature(userId: string, supplied: string | null) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret || !supplied) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(userId).digest("hex"), "hex");
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function unsubscribe(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user");
  if (!userId || !validSignature(userId, searchParams.get("sig"))) return new NextResponse("Invalid unsubscribe link", { status: 400 });
  if (!hasSupabaseWriteConfig()) return new NextResponse("Unsubscribe service is not configured", { status: 503 });

  const supabase = createWriteClient();
  const { error } = await supabase!.from("notification_preferences").upsert({
    user_id: userId,
    trade_alerts_email: false,
    updated_at: new Date().toISOString(),
  });
  if (error) return new NextResponse("Could not update preference", { status: 500 });
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  return unsubscribe(request);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  return new NextResponse(`<!doctype html><html><body style="font-family:Arial,sans-serif;padding:40px;color:#1f2937"><h1>Stop trade alerts?</h1><p>You will no longer receive creator trade-alert emails at this address.</p><form method="post" action="/api/unsubscribe?${query}"><button type="submit" style="padding:10px 16px">Unsubscribe</button></form></body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}
