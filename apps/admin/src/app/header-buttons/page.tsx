import { createServerClient } from "@nomal-world/db/server";
import type { HeaderButton } from "@nomal-world/db/types";
import { HeaderButtonManager } from "@/components/header-button-manager";

export const dynamic = "force-dynamic";

export default async function HeaderButtonsPage() {
  const supabase = createServerClient();
  const { data: buttons } = await supabase
    .from("header_buttons")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">헤더 버튼 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          유저 페이지 헤더에 표시되는 외부 링크 버튼을 관리합니다.
        </p>
      </div>

      <HeaderButtonManager
        buttons={(buttons as HeaderButton[]) || []}
      />
    </div>
  );
}
