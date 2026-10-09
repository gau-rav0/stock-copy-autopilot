import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhookSignature(payload: string, supplied: string | null, secret: string): boolean {
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return timingSafeEqual(Buffer.from(supplied, "hex"), expected);
}
