"use client";

import { useState } from "react";
import { toggleGatheringStatus } from "@/app/actions/gathering";

interface ToggleStatusButtonProps {
  gatheringId: string;
  currentStatus: "draft" | "published" | "closed";
  className?: string;
}

export function ToggleStatusButton({
  gatheringId,
  currentStatus,
  className,
}: ToggleStatusButtonProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const isPublished = status === "published";

  const handleToggle = async () => {
    const action = isPublished ? "비공개로 전환" : "공개";
    if (!confirm(`이 모임을 ${action}하시겠습니까?`)) return;

    setLoading(true);
    try {
      const result = await toggleGatheringStatus(gatheringId);
      setStatus(result.status);
    } catch {
      alert("상태 변경 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const variantClass = isPublished
    ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
    : "bg-primary-600 hover:bg-primary-700 text-white";

  const defaultClass =
    "w-full font-semibold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={handleToggle}
      disabled={loading || status === "closed"}
      className={`${className ?? defaultClass} ${variantClass}`}
      title={status === "closed" ? "마감된 모임은 상태를 변경할 수 없습니다" : undefined}
    >
      {loading
        ? "처리 중..."
        : status === "closed"
        ? "마감됨"
        : isPublished
        ? "비공개로 전환"
        : "공개하기"}
    </button>
  );
}
