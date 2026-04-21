"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { togglePinGathering, updatePinOrder } from "@/app/actions/gathering";

interface GatheringItem {
  id: string;
  title: string;
  status: string;
  is_pinned: boolean;
  pin_order: number;
  host: { name: string | null; email: string } | null;
  category: { name: string } | null;
}

interface Props {
  pinnedGatherings: GatheringItem[];
  availableGatherings: GatheringItem[];
}

export function PinnedGatheringsManager({ pinnedGatherings, availableGatherings }: Props) {
  const router = useRouter();
  const [pinned, setPinned] = useState(pinnedGatherings);
  const [available, setAvailable] = useState(availableGatherings);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = available.filter(
    (g) => g.title.toLowerCase().includes(search.toLowerCase())
  );

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const next = [...pinned];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setPinned(next);
    setLoading(true);
    try {
      await updatePinOrder(next.map((g) => g.id));
      router.refresh();
    } catch {
      alert("순서 변경 중 오류가 발생했습니다.");
      setPinned(pinned);
    } finally {
      setLoading(false);
    }
  };

  const moveDown = async (index: number) => {
    if (index === pinned.length - 1) return;
    const next = [...pinned];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setPinned(next);
    setLoading(true);
    try {
      await updatePinOrder(next.map((g) => g.id));
      router.refresh();
    } catch {
      alert("순서 변경 중 오류가 발생했습니다.");
      setPinned(pinned);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (gatheringId: string) => {
    const item = pinned.find((g) => g.id === gatheringId);
    if (!item) return;

    // 즉시 로컬 state 반영
    setPinned((prev) => prev.filter((g) => g.id !== gatheringId));
    setAvailable((prev) => [...prev, { ...item, is_pinned: false, pin_order: 0 }]);
    setLoading(true);
    try {
      await togglePinGathering(gatheringId, false);
      router.refresh();
    } catch {
      // 롤백
      setPinned(pinned);
      setAvailable(available);
      alert("고정 해제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (gatheringId: string) => {
    const item = available.find((g) => g.id === gatheringId);
    if (!item) return;

    // 즉시 로컬 state 반영
    const newPinOrder = pinned.length;
    setAvailable((prev) => prev.filter((g) => g.id !== gatheringId));
    setPinned((prev) => [...prev, { ...item, is_pinned: true, pin_order: newPinOrder }]);
    setLoading(true);
    try {
      await togglePinGathering(gatheringId, true);
      router.refresh();
    } catch {
      // 롤백
      setPinned(pinned);
      setAvailable(available);
      alert("고정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    draft: "초안",
    published: "공개",
    closed: "마감",
  };

  return (
    <div className="space-y-8">
      {/* 고정된 모임 목록 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          고정된 모임 ({pinned.length}개)
        </h2>
        {pinned.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground w-20">순서</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">제목</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">호스트</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">카테고리</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">상태</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground w-40">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pinned.map((g, index) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0 || loading}
                          className="text-sm px-1.5 py-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === pinned.length - 1 || loading}
                          className="text-sm px-1.5 py-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{g.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {g.host?.name || g.host?.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{g.category?.name || "-"}</td>
                    <td className="px-6 py-4 text-sm">{statusLabel[g.status] || g.status}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUnpin(g.id)}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        고정 해제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center text-muted-foreground">
            고정된 모임이 없습니다. 아래에서 모임을 선택하여 고정하세요.
          </div>
        )}
      </div>

      {/* 모임 추가 섹션 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">모임 고정 추가</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="모임 검색..."
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
        />
        {filtered.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">제목</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">호스트</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">카테고리</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{g.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {g.host?.name || g.host?.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{g.category?.name || "-"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePin(g.id)}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        고정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center text-muted-foreground">
            {search ? "검색 결과가 없습니다." : "고정 가능한 공개 모임이 없습니다."}
          </div>
        )}
      </div>
    </div>
  );
}
