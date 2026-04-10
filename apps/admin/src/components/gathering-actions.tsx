"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@nestly/db/client";

interface GatheringActionsProps {
  gatheringId: string;
  currentStatus: string;
}

export function GatheringActions({ gatheringId, currentStatus }: GatheringActionsProps) {
  const router = useRouter();

  const updateStatus = async (newStatus: "draft" | "published" | "closed") => {
    const supabase = createClient();
    await supabase
      .from("gatherings")
      .update({ status: newStatus })
      .eq("id", gatheringId);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 모임을 삭제하시겠습니까?")) return;

    const supabase = createClient();
    await supabase.from("gatherings").delete().eq("id", gatheringId);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      {currentStatus !== "published" && (
        <button
          onClick={() => updateStatus("published")}
          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
        >
          공개
        </button>
      )}
      {currentStatus !== "closed" && (
        <button
          onClick={() => updateStatus("closed")}
          className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
        >
          마감
        </button>
      )}
      {currentStatus !== "draft" && (
        <button
          onClick={() => updateStatus("draft")}
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
