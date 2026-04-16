import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@nomal-world/db/server";
import { GatheringDetail } from "@nomal-world/ui/gathering-detail";
import { DeleteGatheringButton } from "@/components/delete-gathering-button";
import { ToggleStatusButton } from "@/components/toggle-status-button";
import type { GatheringWithCategory } from "@nomal-world/db/types";

export const dynamic = "force-dynamic";

export default async function GatheringViewPage({
  params,
}: {
  params: { id: string };
}) {
  let gathering: GatheringWithCategory | null = null;

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("gatherings")
      .select("*, category:categories(*)")
      .eq("id", params.id)
      .single();

    gathering = data as unknown as GatheringWithCategory;
  } catch {
    notFound();
  }

  if (!gathering) notFound();

  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-0">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground shrink-0">
            ← 뒤로
          </Link>
          <span className="text-lg font-semibold line-clamp-1 flex-1">
            {gathering.title}
          </span>
        </div>
      </header>

      <GatheringDetail
        gathering={gathering}
        editHref={`/gatherings/${params.id}/edit`}
        actionsSlot={
          <ToggleStatusButton
            gatheringId={params.id}
            currentStatus={gathering.status}
          />
        }
      />

      {/* Edit / Delete buttons (모바일/태블릿 전용) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <Link
              href={`/gatherings/${params.id}/edit`}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-center"
            >
              편집하기
            </Link>
            <ToggleStatusButton
              gatheringId={params.id}
              currentStatus={gathering.status}
              className="flex-1 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <DeleteGatheringButton
            gatheringId={params.id}
            className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
            label="모임 삭제"
          />
        </div>
      </div>
    </main>
  );
}
