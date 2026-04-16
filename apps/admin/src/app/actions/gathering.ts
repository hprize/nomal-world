"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@nomal-world/db/server";
import { revalidatePath } from "next/cache";
import type { EditorJSContent } from "@nomal-world/db/types";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertAdmin(): Promise<void> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
}

const BUCKET = "gathering-images";

function extractPathFromUrl(rawUrl: string): string | null {
  try {
    const { pathname } = new URL(rawUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

function extractStoragePaths(thumbnailUrl: string | null, content: unknown): string[] {
  const paths: string[] = [];

  if (thumbnailUrl) {
    const p = extractPathFromUrl(thumbnailUrl);
    if (p) paths.push(p);
  }

  const blocks = (content as EditorJSContent | null)?.blocks ?? [];
  for (const block of blocks) {
    if (block.type === "image") {
      const url = (block.data as { file?: { url?: string } })?.file?.url;
      if (url) {
        const p = extractPathFromUrl(url);
        if (p) paths.push(p);
      }
    }
  }

  return paths;
}

export async function deleteGathering(gatheringId: string): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();

  const { data: gathering, error: fetchError } = await supabase
    .from("gatherings")
    .select("thumbnail_url, content")
    .eq("id", gatheringId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const paths = extractStoragePaths(gathering.thumbnail_url, gathering.content);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("gatherings").delete().eq("id", gatheringId);
  if (error) throw new Error(error.message);
  revalidatePath("/gatherings");
}

export async function updateGatheringStatus(
  gatheringId: string,
  status: "draft" | "published" | "closed"
): Promise<void> {
  await assertAdmin();

  const supabase = getAdminClient();
  const { error } = await supabase.from("gatherings").update({ status }).eq("id", gatheringId);
  if (error) throw new Error(error.message);
  revalidatePath("/gatherings");
}
