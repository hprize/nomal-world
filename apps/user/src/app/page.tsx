import { GatheringCard } from "@nestly/ui/gathering-card";
import { CategoryFilter } from "@/components/category-filter";
import { createClient } from "@nestly/db/client";
import type { GatheringWithCategory } from "@nestly/db/types";

export const dynamic = "force-dynamic";

async function getGatherings(category?: string): Promise<GatheringWithCategory[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("gatherings")
      .select("*, category:categories(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("categories.slug", category);
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
          <h1 className="text-2xl font-bold text-primary-600">Nestly</h1>
          <p className="text-sm text-muted-foreground mt-1">
            새로운 모임을 발견하세요
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
