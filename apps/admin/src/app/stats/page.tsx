import { createServerClient } from "@nomal-world/db/server";

export const dynamic = "force-dynamic";

interface GatheringStats {
  id: string;
  title: string;
  status: string;
  category_name: string | null;
  view_count: number;
  apply_count: number;
}

interface CategoryStats {
  category_name: string;
  view_count: number;
  apply_count: number;
}

export default async function StatsPage() {
  const supabase = createServerClient();

  // 모임별 통계
  const { data: gatheringRows } = await supabase
    .from("gatherings")
    .select("id, title, status, categories(name), gathering_events(event_type)")
    .order("created_at", { ascending: false });

  const gatheringStats: GatheringStats[] = (gatheringRows ?? []).map((g: any) => {
    const events: { event_type: string }[] = g.gathering_events ?? [];
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      category_name: g.categories?.name ?? null,
      view_count: events.filter((e) => e.event_type === "view").length,
      apply_count: events.filter((e) => e.event_type === "apply_click").length,
    };
  });

  gatheringStats.sort((a, b) => b.view_count - a.view_count);

  // 카테고리별 통계 집계
  const categoryMap = new Map<string, { view_count: number; apply_count: number }>();
  for (const g of gatheringStats) {
    const key = g.category_name ?? "미분류";
    const prev = categoryMap.get(key) ?? { view_count: 0, apply_count: 0 };
    categoryMap.set(key, {
      view_count: prev.view_count + g.view_count,
      apply_count: prev.apply_count + g.apply_count,
    });
  }
  const categoryStats: CategoryStats[] = Array.from(categoryMap.entries())
    .map(([category_name, counts]) => ({ category_name, ...counts }))
    .sort((a, b) => b.view_count - a.view_count);

  const totalViews = gatheringStats.reduce((s, g) => s + g.view_count, 0);
  const totalApplies = gatheringStats.reduce((s, g) => s + g.apply_count, 0);

  const statusLabel: Record<string, string> = {
    published: "공개",
    draft: "비공개",
    closed: "마감",
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">통계</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "총 조회수", value: totalViews.toLocaleString() },
          { label: "총 신청 클릭수", value: totalApplies.toLocaleString() },
          {
            label: "전체 전환율",
            value: totalViews > 0 ? `${((totalApplies / totalViews) * 100).toFixed(1)}%` : "-",
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-6 border">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* 카테고리별 통계 */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">카테고리별 통계</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">카테고리</th>
              <th className="px-6 py-3 text-right">조회수</th>
              <th className="px-6 py-3 text-right">신청 클릭</th>
              <th className="px-6 py-3 text-right">전환율</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categoryStats.map((cat) => (
              <tr key={cat.category_name} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{cat.category_name}</td>
                <td className="px-6 py-3 text-right">{cat.view_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">{cat.apply_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-gray-500">
                  {cat.view_count > 0
                    ? `${((cat.apply_count / cat.view_count) * 100).toFixed(1)}%`
                    : "-"}
                </td>
              </tr>
            ))}
            {categoryStats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  아직 데이터가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 모임별 통계 */}
      <section className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">모임별 통계</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">모임명</th>
              <th className="px-6 py-3 text-left">카테고리</th>
              <th className="px-6 py-3 text-left">상태</th>
              <th className="px-6 py-3 text-right">조회수</th>
              <th className="px-6 py-3 text-right">신청 클릭</th>
              <th className="px-6 py-3 text-right">전환율</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {gatheringStats.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium max-w-xs truncate">{g.title}</td>
                <td className="px-6 py-3 text-gray-500">{g.category_name ?? "-"}</td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      g.status === "published"
                        ? "bg-green-100 text-green-700"
                        : g.status === "closed"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {statusLabel[g.status] ?? g.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">{g.view_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-right">{g.apply_count.toLocaleString()}</td>
                <td className="px-6 py-3 text-right text-gray-500">
                  {g.view_count > 0
                    ? `${((g.apply_count / g.view_count) * 100).toFixed(1)}%`
                    : "-"}
                </td>
              </tr>
            ))}
            {gatheringStats.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  아직 데이터가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
