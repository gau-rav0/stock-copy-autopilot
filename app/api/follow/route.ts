import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function resolveProfileId(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, identifier: unknown) {
  if (typeof identifier !== "string" || !identifier.trim()) return null;

  const value = identifier.trim();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .or(`id.eq.${value},slug.eq.${value}`)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await request.json().catch(() => ({}));
  
  if (!profileId) {
    return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
  }

  const resolvedProfileId = await resolveProfileId(supabase, profileId);
  if (!resolvedProfileId) {
    return NextResponse.json({ error: "Investor profile was not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("followers")
    .upsert({
      follower_user_id: user.id,
      profile_id: resolvedProfileId,
    }, { onConflict: "follower_user_id,profile_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileId } = await request.json().catch(() => ({}));
  
  if (!profileId) {
    return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
  }

  const resolvedProfileId = await resolveProfileId(supabase, profileId);
  if (!resolvedProfileId) {
    return NextResponse.json({ error: "Investor profile was not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("profile_id", resolvedProfileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ following: false });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
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

  const resolvedProfileId = await resolveProfileId(supabase, profileId);
  if (!resolvedProfileId) return NextResponse.json({ following: false });

  const { data, error } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_user_id", user.id)
    .eq("profile_id", resolvedProfileId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ following: false });
  }

  return NextResponse.json({ following: !!data });
}
