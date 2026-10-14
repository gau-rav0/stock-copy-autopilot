import { createWriteClient } from "@/lib/supabase/server";
import { PRODUCT_EVENTS } from "@/lib/product-events";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: Request) {
  if (!rateLimit(`events:${getClientIp(request)}`, { maxRequests: 40 }).success)
    return new NextResponse(null, { status: 429 });
  if (Number(request.headers.get("content-length")) > 1000)
    return new NextResponse(null, { status: 413 });
  const body = z
    .object({ event: z.enum(PRODUCT_EVENTS) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return new NextResponse(null, { status: 400 });
  const write = createWriteClient();
  if (!write) return new NextResponse(null, { status: 503 });
  const { error } = await write
    .from("product_events")
    .insert({ event: body.data.event });
  return new NextResponse(null, { status: error ? 503 : 204 });
}
