"use client";

import { useState } from "react";
import { deleteGathering } from "@/app/actions/gathering";

interface DeleteGatheringButtonProps {
  gatheringId: string;
  className?: string;
  label?: string;
}

export function DeleteGatheringButton({
  gatheringId,
  className,
  label = "모임 삭제",
}: DeleteGatheringButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말 이 모임을 삭제하시겠습니까?\n삭제된 모임은 복구할 수 없습니다.")) return;

    setLoading(true);
    try {
      await deleteGathering(gatheringId);
    } catch {
      alert("삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={
        className ??
        "w-full border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      }
    >
      {loading ? "삭제 중..." : label}
    </button>
  );
}
