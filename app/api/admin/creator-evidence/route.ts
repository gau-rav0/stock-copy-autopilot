import { createClient, createWriteClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const auth = await createClient();
  if (!auth)
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401, headers },
    );
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401, headers },
    );
  const { data: role } = await auth
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (role?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403, headers },
    );
  const id = z
    .string()
    .uuid()
    .safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success)
    return NextResponse.json(
      { error: "Valid application required." },
      { status: 400, headers },
    );
  const write = createWriteClient();
  if (!write)
    return NextResponse.json(
      { error: "Evidence storage unavailable." },
      { status: 503, headers },
    );
  const { data: application } = await write
    .from("creator_applications")
    .select("evidence_path,evidence_sha256")
    .eq("id", id.data)
    .single();
  if (!application?.evidence_path)
    return NextResponse.json(
      {
        error:
          "No original statement on file. Request fresh evidence from the creator.",
      },
      { status: 404, headers },
    );
  const { data, error } = await write.storage
    .from("creator-evidence")
    .createSignedUrl(application.evidence_path, 60);
  if (error || !data)
    return NextResponse.json(
      { error: "Could not open the original statement." },
      { status: 503, headers },
    );
  const { error: logError } = await write
    .from("creator_evidence_access_logs")
    .insert({ application_id: id.data, reviewer_id: user.id, action: "view" });
  if (logError)
    return NextResponse.json(
      { error: "Could not record evidence access. Please try again." },
      { status: 503, headers },
    );
  return NextResponse.json(
    { url: data.signedUrl, checksum: application.evidence_sha256 },
    { headers },
  );
}
