import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@nestly/db/server";
import { GatheringForm } from "@/components/gathering-form";
import type { Gathering, Category } from "@nestly/db/types";

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
            ← 뒤로
          </Link>
          <h1 className="text-lg font-semibold">모임 편집</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <GatheringForm
          mode="edit"
          gathering={gathering}
          categories={categories}
        />
      </div>
    </main>
  );
}
