import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@nestly/db/server";
import { GatheringDetail } from "@nestly/ui/gathering-detail";
import type { GatheringWithCategory } from "@nestly/db/types";

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
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← 뒤로
          </Link>
          <span className="text-lg font-semibold line-clamp-1">
            {gathering.title}
          </span>
        </div>
      </header>

      <GatheringDetail gathering={gathering} />

      {/* Edit button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/gatherings/${params.id}/edit`}
            className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
          >
            편집하기
          </Link>
        </div>
      </div>
    </main>
  );
}
