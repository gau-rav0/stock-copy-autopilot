import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase
    .from("followers")
    .insert({
      follower_user_id: user.id,
      profile_id: profileId,
    });

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

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("profile_id", profileId);

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

  const { data, error } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_user_id", user.id)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ following: false });
  }

  return NextResponse.json({ following: !!data });
}
