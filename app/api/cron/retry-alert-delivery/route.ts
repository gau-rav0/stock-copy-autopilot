import { NextResponse } from "next/server";
import { createWriteClient, hasSupabaseWriteConfig } from "@/lib/supabase/server";
import { retryFailedTradeAlerts } from "@/lib/trade-alert-delivery";
import { secureStringEquals } from "@/lib/secure-compare";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || !secureStringEquals(request.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!hasSupabaseWriteConfig()) return new NextResponse("Supabase service-role access is not configured", { status: 503 });

  try {
    const supabase = createWriteClient();
    if (!supabase) return new NextResponse("Storage not configured", { status: 503 });
    const result = await retryFailedTradeAlerts(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Alert retry error", error);
    return new NextResponse("Retry failed", { status: 500 });
  }
}
