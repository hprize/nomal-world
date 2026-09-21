"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nomal-world/db/client";
import { updateGathering } from "@/app/actions/gathering";
import { SaveError } from "@/lib/save-error";
import { toDateTimeLocal, fromDateTimeLocal } from "@/lib/datetime";
import type { Gathering, Category, EditorJSContent } from "@nomal-world/db/types";
import dynamic from "next/dynamic";
import { ThumbnailCropSection } from "./thumbnail-crop-section";
import type { ContentEditorHandle, ContentEditorProps } from "./content-editor";
import type { ThumbnailCropSectionHandle } from "./thumbnail-crop-section";

// next/dynamic(App Router)은 ref를 로드된 컴포넌트에 전달하지 않는다(LoadableComponent가 forwardRef가 아님).
// ref를 그대로 넘기면 contentEditorRef.current가 항상 null이라 이미지 업로드가 조용히 건너뛰어지므로,
// 일반 prop(editorRef)으로 받아 내부의 forwardRef 컴포넌트에 직접 연결한다.
const ContentEditor = dynamic(
  () =>
    import("./content-editor").then(({ default: Editor }) => {
      function ContentEditorWithRef({
        editorRef,
        ...props
      }: ContentEditorProps & { editorRef: React.Ref<ContentEditorHandle> }) {
        return <Editor ref={editorRef} {...props} />;
      }
      return ContentEditorWithRef;
    }),
  { ssr: false }
);

/** 업로드되지 않은 임시(blob:) 이미지가 남아 있는지 검사 — 이런 content는 절대 DB에 저장하면 안 된다 */
function hasUnuploadedImage(content: EditorJSContent | null): boolean {
  return (content?.blocks ?? []).some((block) => {
    if (block.type !== "image") return false;
    const url = (block.data as { file?: { url?: string } })?.file?.url ?? "";
    return url.startsWith("blob:");
  });
}

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
  const contentEditorRef = useRef<ContentEditorHandle>(null);
  const thumbnailSectionRef = useRef<ThumbnailCropSectionHandle>(null);

  const [dateTbd, setDateTbd] = useState(!gathering?.date);
  const [form, setForm] = useState({
    title: gathering?.title || "",
    summary: gathering?.summary || "",
    category_id: gathering?.category_id || "",
    // datetime-local 값은 KST 기준 문자열 (toISOString은 UTC라 9시간 어긋남)
    date: toDateTimeLocal(gathering?.date),
    location: gathering?.location || "",
    capacity: gathering?.capacity?.toString() || "",
    cost: gathering?.cost?.toString() || "0",
    google_form_url: gathering?.google_form_url || "",
    recruitment_start: toDateTimeLocal(gathering?.recruitment_start),
    recruitment_end: toDateTimeLocal(gathering?.recruitment_end),
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

    // 이번 저장 시도에 업로드된 파일 경로 — DB 저장 실패 시 전부 롤백(삭제)
    const uploadedPaths: string[] = [];
    // DB 저장이 확정되면 롤백 금지 — 커밋된 행이 참조하는 이미지를 지우면 안 됨
    let dbCommitted = false;
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // === Phase 1: 이미지 업로드 ===
      // 에디터가 저장 시점의 최신 내용을 직접 읽어 pending(blob·File)을 업로드하고 실제 URL로 교체한다.
      // 각 flush는 pending을 정리하지 않고 업로드한 파일 경로만 반환 → 저장 전체가 성공해야 commit()으로 정리.
      // 에디터 핸들이 없으면 조용히 건너뛰지 않고 실패시킨다 — 건너뛰면 blob: URL이 그대로 저장된다.
      const editor = contentEditorRef.current;
      if (!editor) {
        throw new SaveError("에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      }
      const flushedContent = await editor.flushPendingUploads();
      uploadedPaths.push(...flushedContent.uploadedPaths);
      // 블록이 하나도 없으면 null로 저장 (DB에서 null = 소개 없음)
      const content = flushedContent.content.blocks.length > 0 ? flushedContent.content : null;

      // 마지막 방어선: 업로드되지 않은 임시 URL이 남아 있으면 DB에 쓰지 않는다
      if (hasUnuploadedImage(content)) {
        throw new SaveError("업로드되지 않은 이미지가 있어 저장할 수 없습니다. 이미지를 다시 첨부해주세요.");
      }

      const flushedThumbnails = await thumbnailSectionRef.current?.flushPendingUploads();
      if (flushedThumbnails) uploadedPaths.push(...flushedThumbnails.uploadedPaths);

      const gatheringData = {
        title: form.title,
        summary: form.summary || null,
        category_id: form.category_id || null,
        date: dateTbd ? null : fromDateTimeLocal(form.date),
        location: form.location || null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        cost: parseInt(form.cost) || 0,
        google_form_url: form.google_form_url || null,
        recruitment_start: fromDateTimeLocal(form.recruitment_start),
        recruitment_end: fromDateTimeLocal(form.recruitment_end),
        thumbnail_url: (flushedThumbnails?.cardUrl ?? form.thumbnail_url) || null,
        thumbnail_detail_url: (flushedThumbnails?.detailUrl ?? form.thumbnail_detail_url) || null,
        content,
        status,
      };

      // === Phase 2: DB 저장 ===
      if (mode === "create") {
        const { error } = await supabase
          .from("gatherings")
          .insert({ ...gatheringData, host_id: user.id });
        if (error) throw error;
      } else if (gathering) {
        await updateGathering(gathering.id, gatheringData);
      }
      dbCommitted = true;

      // === 성공 확정 → pending 정리 ===
      contentEditorRef.current?.commit();
      thumbnailSectionRef.current?.commit();

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("[gathering-form] 저장 실패", err);
      // 롤백: 이번 시도에 업로드된 파일 전부 삭제 (pending은 보존 → 재시도 시 정상 재업로드)
      // 단, DB가 이미 커밋됐다면 그 파일들은 저장된 행이 참조하므로 절대 삭제하지 않는다.
      if (!dbCommitted && uploadedPaths.length > 0) {
        try {
          await supabase.storage.from("gathering-images").remove(uploadedPaths);
        } catch {
          // 롤백 삭제 실패는 조용히 무시 — 사용자에겐 저장 실패만 표시
        }
      }
      setError(err instanceof SaveError ? err.message : "저장 중 오류가 발생했습니다.");
      // 실패 시에만 리셋 — 성공 후 router.push() 도중 버튼이 재활성화되는 것을 방지
      savingRef.current = false;
      setSaving(false);
    }
  };

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
          ref={thumbnailSectionRef}
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
          editorRef={contentEditorRef}
          initialData={gathering?.content || undefined}
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
