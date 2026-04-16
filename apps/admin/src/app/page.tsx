import { createServerClient } from "@nomal-world/db/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let totalGatherings = 0;
  let publishedGatherings = 0;
  let totalHosts = 0;
  let recentGatherings: { id: string; title: string; status: string; created_at: string }[] = [];

  try {
    const supabase = createServerClient();

    const [allRes, pubRes, hostsRes, recentRes] = await Promise.all([
      supabase.from("gatherings").select("id", { count: "exact", head: true }),
      supabase.from("gatherings").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "host"),
      supabase.from("gatherings").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    totalGatherings = allRes.count || 0;
    publishedGatherings = pubRes.count || 0;
    totalHosts = hostsRes.count || 0;
    recentGatherings = recentRes.data || [];
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
      <h1 className="text-2xl font-bold mb-8">대시보드</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6">
          <p className="text-sm text-muted-foreground">총 모임 수</p>
          <p className="text-3xl font-bold mt-2">{totalGatherings}</p>
        </div>
        <div className="bg-white rounded-xl p-6">
          <p className="text-sm text-muted-foreground">공개 모임</p>
          <p className="text-3xl font-bold mt-2">{publishedGatherings}</p>
        </div>
        <div className="bg-white rounded-xl p-6">
          <p className="text-sm text-muted-foreground">등록 호스트</p>
          <p className="text-3xl font-bold mt-2">{totalHosts}</p>
        </div>
      </div>

      {/* Recent Gatherings */}
      <div className="bg-white rounded-xl">
        <div className="p-6 border-b">
          <h2 className="font-semibold">최근 모임</h2>
        </div>
        {recentGatherings.length > 0 ? (
          <ul className="divide-y">
            {recentGatherings.map((g) => {
              const status = statusLabel[g.status] || statusLabel.draft;
              return (
                <li key={g.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(g.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                    {status.text}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-6">
            <p className="text-muted-foreground text-center py-8">
              등록된 모임이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
