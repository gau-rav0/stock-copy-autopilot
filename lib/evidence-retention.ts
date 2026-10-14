import type { SupabaseClient } from "@supabase/supabase-js";

export async function removeExpiredEvidence(supabase: SupabaseClient) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("creator_applications")
    .select("id,evidence_path")
    .lt("evidence_uploaded_at", cutoff)
    .not("evidence_path", "is", null)
    .limit(50);
  if (error) throw new Error("Could not load expired evidence");
  let removed = 0;
  for (const item of data ?? []) {
    const { error: removalError } = await supabase.storage
      .from("creator-evidence")
      .remove([item.evidence_path]);
    if (removalError) throw new Error("Could not remove expired evidence");
    const { error: updateError } = await supabase
      .from("creator_applications")
      .update({ evidence_path: null })
      .eq("id", item.id)
      .eq("evidence_path", item.evidence_path);
    if (updateError) throw new Error("Could not record evidence expiry");
    removed++;
  }
  return removed;
}
