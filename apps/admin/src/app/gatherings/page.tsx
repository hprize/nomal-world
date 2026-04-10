import { createServerClient } from "@nestly/db/server";
import { GatheringActions } from "@/components/gathering-actions";

export const dynamic = "force-dynamic";

interface GatheringRow {
  id: string;
  title: string;
  status: string;
  date: string | null;
  created_at: string;
  host: { name: string | null; email: string } | null;
  category: { name: string } | null;
}

export default async function GatheringsManagePage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  let gatherings: GatheringRow[] = [];

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("gatherings")
      .select("id, title, status, date, created_at, host:profiles(name, email), category:categories(name)")
      .order("created_at", { ascending: false });

    if (searchParams.status && searchParams.status !== "all") {
      query = query.eq("status", searchParams.status);
    }
    if (searchParams.q) {
      query = query.ilike("title", `%${searchParams.q}%`);
    }

    const { data } = await query;
    gatherings = (data as unknown as GatheringRow[]) || [];
  } catch {
    // Supabase not configured
  }

  const statusLabel: Record<string, { text: string; className: string }> = {
    draft: { text: "초안", className: "bg-gray-100 text-gray-600" },
    published: { text: "공개", className: "bg-green-100 text-green-700" },
    closed: { text: "마감", className: "bg-red-100 text-red-700" },
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">모임 관리</h1>
        <form className="flex gap-3" method="GET">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="모임 검색..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            name="status"
            defaultValue={searchParams.status || "all"}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 상태</option>
            <option value="draft">초안</option>
            <option value="published">공개</option>
            <option value="closed">마감</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">제목</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">호스트</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">카테고리</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">날짜</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">상태</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {gatherings.length > 0 ? (
              gatherings.map((g) => {
                const status = statusLabel[g.status] || statusLabel.draft;
                return (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{g.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {g.host?.name || g.host?.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{g.category?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {g.date ? new Date(g.date).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <GatheringActions gatheringId={g.id} currentStatus={g.status} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  등록된 모임이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
