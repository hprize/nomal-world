import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@nomal-world/db/server";
import { GatheringDetail } from "@nomal-world/ui/gathering-detail";
import type { GatheringWithCategory } from "@nomal-world/db/types";

export const dynamic = "force-dynamic";

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

  return (
    <main className="min-h-screen bg-white">
      {/* Back Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← 뒤로
          </Link>
          <span className="text-lg font-semibold line-clamp-1">
            {gathering.title}
          </span>
        </div>
      </header>

      <GatheringDetail gathering={gathering} />

      {/* Fixed bottom CTA - Google Form link (모바일/태블릿 전용) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-3xl mx-auto">
          {gathering.google_form_url ? (
            <a
              href={gathering.google_form_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
            >
              신청하기
            </a>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
            >
              신청 준비 중
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
