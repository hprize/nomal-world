import Link from "next/link";
import { createServerClient } from "@nestly/db/server";
import { GatheringCard } from "@nestly/ui/gathering-card";
import type { GatheringWithCategory } from "@nestly/db/types";

export const dynamic = "force-dynamic";

export default async function HostDashboard() {
  let gatherings: GatheringWithCategory[] = [];

  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("gatherings")
        .select("*, category:categories(*)")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      gatherings = (data as unknown as GatheringWithCategory[]) || [];
    }
  } catch {
    // Supabase not configured yet
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Nestly 호스트</h1>
            <p className="text-sm text-muted-foreground">내 모임 관리</p>
          </div>
          <Link
            href="/gatherings/new"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + 새로운 모임 생성
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">내 모임</h2>
        {gatherings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gatherings.map((gathering) => (
              <GatheringCard
                key={gathering.id}
                gathering={gathering}
                href={`/gatherings/${gathering.id}`}
                showStatus
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-lg font-medium text-muted-foreground">
              아직 만든 모임이 없습니다
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              새로운 모임을 생성해보세요!
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
