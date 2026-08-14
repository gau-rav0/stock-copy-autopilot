import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Honour the ?next= param forwarded from the sign-in page so users land
  // on the page they were trying to reach before being asked to sign in.
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("://")
    ? requestedNext
    : "/explore";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Use the production URL as the base so the redirect always goes to
        // the live site even if this callback is somehow triggered locally.
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || origin;
        return NextResponse.redirect(`${siteUrl}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
