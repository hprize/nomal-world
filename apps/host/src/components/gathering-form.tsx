"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nomal-world/db/client";
import { updateGathering } from "@/app/actions/gathering";
import type { Gathering, Category, EditorJSContent } from "@nomal-world/db/types";
import dynamic from "next/dynamic";
import { ThumbnailCropSection } from "./thumbnail-crop-section";

const ContentEditor = dynamic(() => import("./content-editor"), { ssr: false });

interface GatheringFormProps {
  mode: "create" | "edit";
  gathering?: Gathering;
  categories: Category[];
}

export function GatheringForm({ mode, gathering, categories }: GatheringFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // 동기적 중복 실행 방지 가드
  const [error, setError] = useState("");
  const editorContentRef = useRef<EditorJSContent | null>(gathering?.content || null);

  const [dateTbd, setDateTbd] = useState(!gathering?.date);
  const [form, setForm] = useState({
    title: gathering?.title || "",
    summary: gathering?.summary || "",
    category_id: gathering?.category_id || "",
    date: gathering?.date ? new Date(gathering.date).toISOString().slice(0, 16) : "",
    location: gathering?.location || "",
    capacity: gathering?.capacity?.toString() || "",
    cost: gathering?.cost?.toString() || "0",
    google_form_url: gathering?.google_form_url || "",
    recruitment_start: gathering?.recruitment_start
      ? new Date(gathering.recruitment_start).toISOString().slice(0, 16)
      : "",
    recruitment_end: gathering?.recruitment_end
      ? new Date(gathering.recruitment_end).toISOString().slice(0, 16)
      : "",
    thumbnail_url: gathering?.thumbnail_url || "",
    thumbnail_detail_url: gathering?.thumbnail_detail_url || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const handleSave = async (status: "draft" | "published") => {
    if (savingRef.current) return; // 중복 클릭 즉시 차단

    if (!form.title.trim()) {
      setError("모임 제목을 입력해주세요.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const gatheringData = {
        title: form.title,
        summary: form.summary || null,
        category_id: form.category_id || null,
        date: (!dateTbd && form.date) ? new Date(form.date).toISOString() : null,
        location: form.location || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        cost: parseInt(form.cost) || 0,
        google_form_url: form.google_form_url || null,
        recruitment_start: form.recruitment_start ? new Date(form.recruitment_start).toISOString() : null,
        recruitment_end: form.recruitment_end ? new Date(form.recruitment_end).toISOString() : null,
        thumbnail_url: form.thumbnail_url || null,
        thumbnail_detail_url: form.thumbnail_detail_url || null,
        content: editorContentRef.current,
        status,
      };

      if (mode === "create") {
        const { error } = await supabase
          .from("gatherings")
          .insert({ ...gatheringData, host_id: user.id });

        if (error) throw error;
        router.push("/");
        router.refresh();
      } else if (gathering) {
        await updateGathering(gathering.id, gatheringData);
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("저장 중 오류가 발생했습니다.");
      // 실패 시에만 리셋 — 성공 후 router.push() 도중 버튼이 재활성화되는 것을 방지
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleEditorChange = useCallback((data: EditorJSContent) => {
    editorContentRef.current = data;
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-white rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">기본 정보</h2>

        <div>
          <label className="block text-sm font-medium mb-1">모임 제목 *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="모임 제목을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">간단 소개</label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="모임을 간단히 소개해주세요"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">날짜</label>
            <div className="flex rounded-lg border overflow-hidden mb-2">
              <button
                type="button"
                onClick={() => setDateTbd(false)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  !dateTbd
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                날짜 지정
              </button>
              <button
                type="button"
                onClick={() => setDateTbd(true)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  dateTbd
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                모집 종료 후 논의
              </button>
            </div>
            {!dateTbd && (
              <input
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">장소</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="서울시 강남구..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">최대 인원</label>
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="10"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비용 (원)</label>
            <input
              type="number"
              name="cost"
              value={form.cost}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">구글폼 URL</label>
            <input
              type="url"
              name="google_form_url"
              value={form.google_form_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://forms.gle/..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">모집 기간</label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                name="recruitment_start"
                value={form.recruitment_start}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500 shrink-0">~</span>
              <input
                type="datetime-local"
                name="recruitment_end"
                value={form.recruitment_end}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              설정하지 않으면 항상 신청 가능합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 대표 이미지 */}
      <section className="bg-white rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">대표 이미지</h2>
        <p className="text-xs text-muted-foreground">
          이미지를 선택한 뒤 카드용(4:3)과 상세용(16:9) 각각 크롭 영역을 지정하고 적용해주세요.
        </p>
        <ThumbnailCropSection
          initialCardUrl={form.thumbnail_url}
          initialDetailUrl={form.thumbnail_detail_url}
          onCardChange={(url) => setForm((prev) => ({ ...prev, thumbnail_url: url }))}
          onDetailChange={(url) => setForm((prev) => ({ ...prev, thumbnail_detail_url: url }))}
        />
      </section>

      {/* 상세 소개 (Editor.js) */}
      <section className="bg-white rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">상세 소개</h2>
        <ContentEditor
          initialData={gathering?.content || undefined}
          onChange={handleEditorChange}
        />
      </section>

      {/* 저장 버튼 */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="flex-1 border border-primary-600 text-primary-600 font-semibold py-3 rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : "초안 저장"}
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={saving}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? "저장 중..." : "공개하기"}
        </button>
      </div>
    </div>
  );
}
