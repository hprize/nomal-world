import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createServerClient } from "@nomal-world/db/server";
import { GatheringDetail } from "@nomal-world/ui/gathering-detail";
import { ViewTracker } from "@/components/view-tracker";
import { ApplyButton } from "@/components/apply-button";
import type { GatheringWithCategory } from "@nomal-world/db/types";

export const revalidate = 300;

async function getGathering(id: string): Promise<GatheringWithCategory | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("gatherings")
      .select("*, category:categories(*)")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    return data as unknown as GatheringWithCategory;
  } catch {
    return null;
  }
}

export default async function GatheringDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const gathering = await getGathering(params.id);

  if (!gathering) {
    notFound();
  }

  const now = new Date();
  const recruitStart = gathering.recruitment_start ? new Date(gathering.recruitment_start) : null;
  const recruitEnd = gathering.recruitment_end ? new Date(gathering.recruitment_end) : null;
  const isBeforeRecruitment = recruitStart !== null && now < recruitStart;
  const isAfterRecruitment = recruitEnd !== null && now > recruitEnd;
  const isRecruitmentActive = !isBeforeRecruitment && !isAfterRecruitment;

  const applyDisabledLabel = isBeforeRecruitment
    ? `모집 시작 전 (${recruitStart!.toLocaleDateString("ko-KR")} 시작)`
    : isAfterRecruitment
    ? "모집 마감"
    : null;

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-0">
      <ViewTracker gatheringId={params.id} />

      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <span className="text-lg font-semibold line-clamp-1">
            {gathering.title}
          </span>
        </div>
      </header>

      <GatheringDetail
        gathering={gathering}
        applySlot={
          gathering.google_form_url && isRecruitmentActive ? (
            <ApplyButton
              gatheringId={params.id}
              url={gathering.google_form_url}
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
            >
              신청하기
            </ApplyButton>
          ) : applyDisabledLabel || !gathering.google_form_url ? (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
            >
              {applyDisabledLabel ?? "신청 준비 중"}
            </button>
          ) : undefined
        }
      />

      {/* Fixed bottom CTA (모바일/태블릿 전용) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-3xl mx-auto">
          {gathering.google_form_url && isRecruitmentActive ? (
            <ApplyButton
              gatheringId={params.id}
              url={gathering.google_form_url}
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
            >
              신청하기
            </ApplyButton>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
            >
              {applyDisabledLabel ?? "신청 준비 중"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
