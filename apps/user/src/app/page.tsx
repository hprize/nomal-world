import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@nomal-world/ui/logo";
import { CategoryFilter } from "@/components/category-filter";
import { GatheringGrid } from "@/components/gathering-grid";
import { GatheringGridSkeleton } from "@/components/gathering-grid-skeleton";
import { Footer } from "@/components/footer";
import { createServerClient } from "@nomal-world/db/server";
import type { HeaderButton } from "@nomal-world/db/types";

export const revalidate = 60;

async function getHeaderButtons(): Promise<HeaderButton[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("header_buttons")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return (data as HeaderButton[]) || [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const headerButtons = await getHeaderButtons();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/">
                <Logo />
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                말도 안 되는 우리만의 세상
              </p>
            </div>
            {headerButtons.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {headerButtons.map((btn) => (
                  <a
                    key={btn.id}
                    href={btn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm px-4 py-2 rounded-lg font-bold text-white transition-opacity hover:opacity-80"
                    style={{ backgroundColor: btn.color }}
                  >
                    {btn.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <section className="max-w-6xl mx-auto px-4 py-4">
        <CategoryFilter />
      </section>

      {/* Gathering Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <Suspense key={searchParams.category ?? "all"} fallback={<GatheringGridSkeleton />}>
          <GatheringGrid category={searchParams.category} />
        </Suspense>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
