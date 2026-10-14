/** SearchParams already decodes values. Never decode a redirect a second time. */
export function safeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) {
    return "/explore";
  }
  const base = "https://fvi.invalid";
  try {
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/explore";
  } catch {
    return "/explore";
  }
}
