import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createServerClient } from "@nomal-world/db/server";
import { GatheringForm } from "@/components/gathering-form";
import { DeleteGatheringButton } from "@/components/delete-gathering-button";
import type { Gathering, Category } from "@nomal-world/db/types";

export const dynamic = "force-dynamic";

export default async function EditGatheringPage({
  params,
}: {
  params: { id: string };
}) {
  let gathering: Gathering | null = null;
  let categories: Category[] = [];

  try {
    const supabase = createServerClient();
    const [gatheringRes, categoriesRes] = await Promise.all([
      supabase.from("gatherings").select("*").eq("id", params.id).single(),
      supabase.from("categories").select("*").order("name"),
    ]);

    gathering = gatheringRes.data as unknown as Gathering;
    categories = (categoriesRes.data as Category[]) || [];
  } catch {
    notFound();
  }

  if (!gathering) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={`/gatherings/${params.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold">모임 편집</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <GatheringForm
          mode="edit"
          gathering={gathering}
          categories={categories}
        />

        {/* 위험 구역 */}
        <div className="border border-red-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-red-600">위험 구역</h2>
          <p className="text-sm text-muted-foreground">
            모임을 삭제하면 모든 정보가 영구적으로 제거되며 복구할 수 없습니다.
          </p>
          <DeleteGatheringButton gatheringId={params.id} />
        </div>
      </div>
    </main>
  );
}
