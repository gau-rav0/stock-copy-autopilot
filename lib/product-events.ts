export const PRODUCT_EVENTS = [
  "hero_roast",
  "sample_start",
  "roast_started",
  "roast_success",
  "roast_error",
  "early_access",
  "waitlist_success",
  "waitlist_existing",
  "creator_started",
  "application_success",
  "application_existing",
  "preview_open",
] as const;
export type ProductEvent = (typeof PRODUCT_EVENTS)[number];

export function trackEvent(event: ProductEvent) {
  if (typeof navigator === "undefined") return;
  const body = JSON.stringify({ event });
  if (navigator.sendBeacon)
    navigator.sendBeacon(
      "/api/events",
      new Blob([body], { type: "application/json" }),
    );
  else
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
}
