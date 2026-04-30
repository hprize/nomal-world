import { GatheringCard } from "@nomal-world/ui/gathering-card";
import { createServerClient } from "@nomal-world/db/server";
import type { GatheringWithCategory } from "@nomal-world/db/types";

async function getGatherings(category?: string): Promise<GatheringWithCategory[]> {
  try {
    const supabase = createServerClient();

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
      .order("is_pinned", { ascending: false })
      .order("pin_order", { ascending: true })
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

const MIN_ITEMS = 9; // 스켈레톤과 동일한 3줄 유지

export async function GatheringGrid({ category }: { category?: string }) {
  const gatherings = await getGatherings(category);
  const spacerCount = Math.max(0, MIN_ITEMS - gatherings.length);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 lg:gap-6">
      {gatherings.length > 0 ? (
        gatherings.map((gathering) => (
          <GatheringCard
            key={gathering.id}
            gathering={gathering}
            href={`/gatherings/${gathering.id}`}
            isPinned={gathering.is_pinned}
          />
        ))
      ) : (
        <div className="col-span-2 lg:col-span-3 text-center py-20">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg font-medium text-muted-foreground">
            등록된 모임이 아직 없습니다
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            곧 새로운 모임이 등록될 예정입니다!
          </p>
        </div>
      )}
      {spacerCount > 0 &&
        Array.from({ length: spacerCount }).map((_, i) => (
          <div key={`spacer-${i}`} className="invisible" aria-hidden="true">
            <div className="aspect-[4/3]" />
            <div className="pt-3 space-y-2">
              <div className="h-4" />
              <div className="h-3" />
              <div className="h-3" />
            </div>
          </div>
        ))}
    </div>
  );
}
