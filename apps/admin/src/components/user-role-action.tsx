"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@nestly/db/client";

interface UserRoleActionProps {
  userId: string;
  currentRole: string;
}

export function UserRoleAction({ userId, currentRole }: UserRoleActionProps) {
  const router = useRouter();

  const toggleRole = async () => {
    const newRole = currentRole === "admin" ? "host" : "admin";
    const label = newRole === "admin" ? "관리자" : "호스트";

    if (!confirm(`이 사용자를 ${label}(으)로 변경하시겠습니까?`)) return;

    const supabase = createClient();
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    router.refresh();
  };

  return (
    <button
      onClick={toggleRole}
      className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
    >
      {currentRole === "admin" ? "호스트로 변경" : "관리자로 변경"}
    </button>
  );
}
