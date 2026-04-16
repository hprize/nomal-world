"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/actions/user";

interface UserRoleActionProps {
  userId: string;
  currentRole: string;
}

export function UserRoleAction({ userId, currentRole }: UserRoleActionProps) {
  const [loading, setLoading] = useState(false);

  const toggleRole = async () => {
    const newRole = currentRole === "admin" ? "host" : "admin";
    const label = newRole === "admin" ? "관리자" : "호스트";

    if (!confirm(`이 사용자를 ${label}(으)로 변경하시겠습니까?`)) return;

    setLoading(true);
    try {
      await updateUserRole(userId, newRole);
    } catch {
      alert("역할 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleRole}
      disabled={loading}
      className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {loading ? "변경 중..." : currentRole === "admin" ? "호스트로 변경" : "관리자로 변경"}
    </button>
  );
}
