import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ApprovalSchema = z.object({
  applicationId: z.string().uuid(),
  evidenceConfirmed: z.boolean().default(false),
  reviewNotes: z.string().max(3000).default(""),
  statementAsOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase)
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 },
      );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = ApprovalSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "A valid application ID is required" },
        { status: 400 },
      );
    const { data, error } = await supabase.rpc("review_creator_application", {
      p_application_id: parsed.data.applicationId,
      p_evidence_confirmed: parsed.data.evidenceConfirmed,
      p_review_notes: parsed.data.reviewNotes,
      p_statement_as_of: parsed.data.statementAsOf ?? null,
    });
    if (error) {
      const status =
        error.code === "42501"
          ? 403
          : error.code === "P0002"
            ? 404
            : ["22023", "23505"].includes(error.code)
              ? 409
              : 500;
      console.error("Creator approval failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        {
          error:
            status === 500
              ? "Could not approve this application. Please try again."
              : error.message,
        },
        { status },
      );
    }
    const profile = data?.[0];
    if (!profile) throw new Error("Approval returned no profile");
    return NextResponse.json({
      success: true,
      profileId: profile.profile_id,
      slug: profile.slug,
      verified: profile.verified,
    });
  } catch (error) {
    console.error("Approve creator error:", error);
    return NextResponse.json(
      { error: "Could not approve this application. Please try again." },
      { status: 500 },
    );
  }
}
