"use client";

import { useRouter } from "next/navigation";
import { deleteGathering, updateGatheringStatus, togglePinGathering } from "@/app/actions/gathering";

interface GatheringActionsProps {
  gatheringId: string;
  currentStatus: string;
  isPinned: boolean;
}

export function GatheringActions({ gatheringId, currentStatus, isPinned }: GatheringActionsProps) {
  const router = useRouter();

  const handleTogglePin = async () => {
    try {
      await togglePinGathering(gatheringId, !isPinned);
      router.refresh();
    } catch {
      alert("고정 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "published" | "closed") => {
    try {
      await updateGatheringStatus(gatheringId, newStatus);
      router.refresh();
    } catch {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 모임을 삭제하시겠습니까?\n삭제된 모임은 복구할 수 없습니다.")) return;
    try {
      await deleteGathering(gatheringId);
      router.refresh();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleTogglePin}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          isPinned
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
        }`}
      >
        {isPinned ? "고정 해제" : "고정"}
      </button>
      {currentStatus !== "published" && (
        <button
          onClick={() => handleStatusChange("published")}
          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
        >
          공개
        </button>
      )}
      {currentStatus !== "closed" && (
        <button
          onClick={() => handleStatusChange("closed")}
          className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
        >
          마감
        </button>
      )}
      {currentStatus !== "draft" && (
        <button
          onClick={() => handleStatusChange("draft")}
          className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
        >
          비공개
        </button>
      )}
      <button
        onClick={handleDelete}
        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}
