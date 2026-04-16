import { createServerClient } from "@nomal-world/db/server";
import { UserRoleAction } from "@/components/user-role-action";
import type { Profile } from "@nomal-world/db/types";

export const dynamic = "force-dynamic";

export default async function UsersManagePage() {
  let users: Profile[] = [];

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    users = (data as Profile[]) || [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">사용자 관리</h1>

      <div className="bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">이름</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">이메일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">역할</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">가입일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{user.name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role === "admin" ? "관리자" : "호스트"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4">
                    <UserRoleAction userId={user.id} currentRole={user.role} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
