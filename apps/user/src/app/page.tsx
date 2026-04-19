import Link from "next/link";
import { GatheringCard } from "@nomal-world/ui/gathering-card";
import { Logo } from "@nomal-world/ui/logo";
import { CategoryFilter } from "@/components/category-filter";
import { createServerClient } from "@nomal-world/db/server";
import type { GatheringWithCategory } from "@nomal-world/db/types";

export const revalidate = 60;

async function getGatherings(category?: string): Promise<GatheringWithCategory[]> {
  try {
    const supabase = createServerClient();

    // 카테고리 슬러그 → ID 변환 후 필터
    let categoryId: string | undefined;
    if (category && category !== "all") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (!cat) return [];
      categoryId = cat.id;
    }

    let query = supabase
      .from("gatherings")
      .select("*, category:categories(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data as unknown as GatheringWithCategory[]) || [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const gatherings = await getGatherings(searchParams.category);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            말도 안되는 세상
          </p>
        </div>
      </header>

      {/* Category Filter */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <CategoryFilter />
      </section>

      {/* Gathering Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        {gatherings.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 lg:gap-6">
            {gatherings.map((gathering) => (
              <GatheringCard
                key={gathering.id}
                gathering={gathering}
                href={`/gatherings/${gathering.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-lg font-medium text-muted-foreground">
              등록된 모임이 아직 없습니다
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              곧 새로운 모임이 등록될 예정입니다!
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
