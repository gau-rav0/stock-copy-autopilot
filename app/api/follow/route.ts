import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const FollowSchema = z.object({ profileId: z.string().trim().min(1).max(120) });

type ProfileLookup = {
  id: string;
  subscription_fee_inr: number | string | null;
};

async function resolveProfileId(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, identifier: unknown) {
  if (typeof identifier !== "string" || !identifier.trim()) return null;

  const value = identifier.trim();
  const profileQuery = supabase
    .from("profiles")
    .select("id, subscription_fee_inr");

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const { data, error } = isUuid
    ? await profileQuery.eq("id", value).maybeSingle()
    : await profileQuery.eq("slug", value).maybeSingle();

  if (error || !data) return null;
  return data as ProfileLookup;
}

async function isDemoProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  profileId: string
) {
  const { data, error } = await supabase
    .from("portfolios")
    .select("is_demo")
    .eq("profile_id", profileId)
    .eq("name", "Primary")
    .maybeSingle();

  // A missing portfolio is not a followable creator record.
  return Boolean(error || !data || data.is_demo);
}

export async function POST(request: Request) {
  const limiter = rateLimit(`follow:${getClientIp(request)}`, { maxRequests: 20 });
  if (!limiter.success) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = FollowSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid profile ID is required" }, { status: 400 });
  const rawProfileId = parsed.data.profileId;

  const profile = await resolveProfileId(supabase, rawProfileId);
  if (!profile) {
    return NextResponse.json({ error: "Investor profile was not found" }, { status: 404 });
  }

  if (await isDemoProfile(supabase, profile.id)) {
    return NextResponse.json(
      { error: "This is a fictional product preview. Join early access to follow real creators when they launch." },
      { status: 409 }
    );
  }

  let subscriptionId: string | null = null;
  if (Number(profile.subscription_fee_inr ?? 0) > 0) {
    const { data: subscription, error: subscriptionError } = await supabase.from("subscriptions")
      .select("razorpay_subscription_id").eq("follower_user_id", user.id).eq("profile_id", profile.id)
      .eq("status", "active").not("razorpay_subscription_id", "is", null)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (subscriptionError) return NextResponse.json({ error: "Could not check payment status. Try again." }, { status: 503 });
    subscriptionId = subscription?.razorpay_subscription_id ?? null;
    if (!subscriptionId) return NextResponse.json(
      { error: "Payment confirmation is required before following this investor." }, { status: 402 }
    );
  }

  const { error } = await supabase
    .from("followers")
    .upsert({
      follower_user_id: user.id,
      profile_id: profile.id,
      subscribed: Boolean(subscriptionId),
      subscription_id: subscriptionId,
    }, { onConflict: "follower_user_id,profile_id", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(request: Request) {
  const limiter = rateLimit(`follow:${getClientIp(request)}`, { maxRequests: 20 });
  if (!limiter.success) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = FollowSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A valid profile ID is required" }, { status: 400 });
  const rawProfileId = parsed.data.profileId;

  const profile = await resolveProfileId(supabase, rawProfileId);
  if (!profile) {
    return NextResponse.json({ error: "Investor profile was not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("profile_id", profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ following: false });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawProfileId = searchParams.get("profileId");

  if (!rawProfileId) {
    return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ following: false });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ following: false });
  }

  const profile = await resolveProfileId(supabase, rawProfileId);
  if (!profile) return NextResponse.json({ following: false });
  if (await isDemoProfile(supabase, profile.id)) return NextResponse.json({ following: false });

  const { data, error } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_user_id", user.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ following: false });
  }

  return NextResponse.json({ following: !!data });
}
