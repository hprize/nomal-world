"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeaderButton } from "@nomal-world/db/types";
import {
  createHeaderButton,
  updateHeaderButton,
  deleteHeaderButton,
  reorderHeaderButtons,
} from "@/app/actions/header-button";

export function HeaderButtonManager({
  buttons: initialButtons,
}: {
  buttons: HeaderButton[];
}) {
  const router = useRouter();
  const [buttons, setButtons] = useState(initialButtons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#dc3827");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setLabel("");
    setUrl("");
    setColor("#dc3827");
    setIsActive(true);
    setEditingId(null);
    setShowCreate(false);
  };

  const startEdit = (btn: HeaderButton) => {
    setEditingId(btn.id);
    setLabel(btn.label);
    setUrl(btn.url);
    setColor(btn.color);
    setIsActive(btn.is_active);
    setShowCreate(false);
  };

  const startCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!label.trim() || !url.trim()) return;
    setLoading(true);
    try {
      await createHeaderButton({
        label: label.trim(),
        url: url.trim(),
        color,
        display_order: buttons.length,
        is_active: isActive,
      });
      resetForm();
      router.refresh();
    } catch (e) {
      alert(`생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !label.trim() || !url.trim()) return;
    setLoading(true);
    try {
      await updateHeaderButton(editingId, {
        label: label.trim(),
        url: url.trim(),
        color,
        is_active: isActive,
      });
      resetForm();
      router.refresh();
    } catch (e) {
      alert(`수정 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 버튼을 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await deleteHeaderButton(id);
      setButtons((prev) => prev.filter((b) => b.id !== id));
      if (editingId === id) resetForm();
      router.refresh();
    } catch (e) {
      alert(`삭제 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newButtons = [...buttons];
    [newButtons[index - 1], newButtons[index]] = [
      newButtons[index],
      newButtons[index - 1],
    ];
    setButtons(newButtons);
    try {
      await reorderHeaderButtons(newButtons.map((b) => b.id));
      router.refresh();
    } catch (e) {
      setButtons(initialButtons);
      alert(`순서 변경 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
  };

  const moveDown = async (index: number) => {
    if (index === buttons.length - 1) return;
    const newButtons = [...buttons];
    [newButtons[index], newButtons[index + 1]] = [
      newButtons[index + 1],
      newButtons[index],
    ];
    setButtons(newButtons);
    try {
      await reorderHeaderButtons(newButtons.map((b) => b.id));
      router.refresh();
    } catch (e) {
      setButtons(initialButtons);
      alert(`순서 변경 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    }
  };

  const renderForm = (mode: "create" | "edit") => (
    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">
        {mode === "create" ? "새 버튼 추가" : "버튼 수정"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">라벨</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: 인스타그램"
            className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">색상</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            활성화
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={mode === "create" ? handleCreate : handleUpdate}
          disabled={loading || !label.trim() || !url.trim()}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? "처리 중..."
            : mode === "create"
              ? "추가"
              : "저장"}
        </button>
        <button
          onClick={resetForm}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          취소
        </button>
      </div>
      {/* 미리보기 */}
      {label.trim() && (
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 mb-1">미리보기</p>
          <span
            className="inline-block text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 상단 액션 */}
      <div className="flex justify-end">
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 새 버튼 추가
        </button>
      </div>

      {/* 생성 폼 */}
      {showCreate && renderForm("create")}

      {/* 버튼 목록 */}
      {buttons.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          등록된 헤더 버튼이 없습니다.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  순서
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  라벨
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  URL
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  색상
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  상태
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buttons.map((btn, index) => (
                <tr key={btn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="위로"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === buttons.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                        title="아래로"
                      >
                        ▼
                      </button>
                      <span className="text-gray-400 ml-1">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{btn.label}</td>
                  <td className="px-4 py-3">
                    <a
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block max-w-[200px]"
                    >
                      {btn.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-5 h-5 rounded-full border"
                        style={{ backgroundColor: btn.color }}
                      />
                      <span className="text-xs text-gray-500 font-mono">
                        {btn.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        btn.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {btn.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(btn)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(btn.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 수정 폼 */}
      {editingId && renderForm("edit")}
    </div>
  );
}
