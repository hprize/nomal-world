"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@nomal-world/db/server";
import { redirect } from "next/navigation";
import type { EditorJSContent } from "@nomal-world/db/types";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET = "gathering-images";

/** URL 객체로 파싱해 pathname에서 스토리지 경로만 추출 */
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

/** content 블록에서 이미지 URL 목록 추출 */
function getContentImageUrls(content: unknown): string[] {
  const blocks = (content as EditorJSContent | null)?.blocks ?? [];
  return blocks
    .filter((b) => b.type === "image")
    .map((b) => (b.data as { file?: { url?: string } })?.file?.url)
    .filter((url): url is string => !!url);
}

export type GatheringUpdateData = {
  title: string;
  summary: string | null;
  category_id: string | null;
  date: string | null;
  location: string | null;
  capacity: number | null;
  cost: number;
  google_form_url: string | null;
  recruitment_start: string | null;
  recruitment_end: string | null;
  thumbnail_url: string | null;
  content: EditorJSContent | null;
  status: "draft" | "published";
};

export async function updateGathering(
  gatheringId: string,
  data: GatheringUpdateData
): Promise<void> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 저장 전 현재 DB 데이터 조회 (비교용)
  const { data: old, error: fetchError } = await supabase
    .from("gatherings")
    .select("host_id, thumbnail_url, content")
    .eq("id", gatheringId)
    .single();

  if (fetchError || !old) throw new Error("Gathering not found");
  if (old.host_id !== user.id) throw new Error("Forbidden");

  // 삭제할 고아 파일 목록 계산
  const pathsToDelete: string[] = [];

  // 1) 대표 이미지가 교체된 경우: 기존 썸네일 삭제
  if (old.thumbnail_url && old.thumbnail_url !== data.thumbnail_url) {
    const p = extractPathFromUrl(old.thumbnail_url);
    if (p) pathsToDelete.push(p);
  }

  // 2) 소개글에서 제거된 이미지: 이전 content에는 있지만 새 content에는 없는 URL 삭제
  const oldImageUrls = new Set(getContentImageUrls(old.content));
  const newImageUrls = new Set(getContentImageUrls(data.content));
  for (const url of oldImageUrls) {
    if (!newImageUrls.has(url)) {
      const p = extractPathFromUrl(url);
      if (p) pathsToDelete.push(p);
    }
  }

  const adminClient = getAdminClient();

  if (pathsToDelete.length > 0) {
    await adminClient.storage.from(BUCKET).remove(pathsToDelete);
  }

  const { error } = await adminClient
    .from("gatherings")
    .update({
      title: data.title,
      summary: data.summary,
      category_id: data.category_id,
      date: data.date,
      location: data.location,
      capacity: data.capacity,
      cost: data.cost,
      google_form_url: data.google_form_url,
      recruitment_start: data.recruitment_start,
      recruitment_end: data.recruitment_end,
      thumbnail_url: data.thumbnail_url,
      content: data.content as unknown,
      status: data.status,
    })
    .eq("id", gatheringId);

  if (error) throw new Error(error.message);
}

export async function toggleGatheringStatus(
  gatheringId: string
): Promise<{ status: "draft" | "published" | "closed" }> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: gathering, error: fetchError } = await supabase
    .from("gatherings")
    .select("host_id, status")
    .eq("id", gatheringId)
    .single();

  if (fetchError || !gathering) throw new Error("Gathering not found");
  if (gathering.host_id !== user.id) throw new Error("Forbidden");
  if (gathering.status === "closed") throw new Error("Closed gatherings cannot change status");

  const nextStatus =
    gathering.status === "published" ? "draft" : "published";

  const adminClient = getAdminClient();
  const { error } = await adminClient
    .from("gatherings")
    .update({ status: nextStatus })
    .eq("id", gatheringId);

  if (error) throw new Error(error.message);

  return { status: nextStatus };
}

export async function deleteGathering(gatheringId: string): Promise<void> {
  // 현재 로그인 유저 확인
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 소유 확인
  const { data: gathering, error: fetchError } = await supabase
    .from("gatherings")
    .select("host_id, thumbnail_url, content")
    .eq("id", gatheringId)
    .single();

  if (fetchError || !gathering) throw new Error("Gathering not found");
  if (gathering.host_id !== user.id) throw new Error("Forbidden");

  // 이미지 경로 수집 후 Storage 삭제 (service role 사용)
  const adminClient = getAdminClient();
  const paths = extractStoragePaths(gathering.thumbnail_url, gathering.content);
  if (paths.length > 0) {
    await adminClient.storage.from(BUCKET).remove(paths);
  }

  // DB 행 삭제 (service role로 RLS 우회)
  const { error } = await adminClient.from("gatherings").delete().eq("id", gatheringId);
  if (error) throw new Error(error.message);

  redirect("/");
}
