"use client";

import { useEffect, useRef, useCallback } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
import Delimiter from "@editorjs/delimiter";
import ImageTool from "@editorjs/image";
import AlignmentBlockTune from "editorjs-text-alignment-blocktune";
import { ImageSizeTune } from "./image-size-tune";
import { createClient } from "@nomal-world/db/client";
import type { EditorJSContent } from "@nomal-world/db/types";

interface ContentEditorProps {
  initialData?: EditorJSContent;
  onChange?: (data: EditorJSContent) => void;
}

export default function ContentEditor({ initialData, onChange }: ContentEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  const uploadImage = useCallback(async (file: File) => {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("gathering-images")
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("gathering-images")
      .getPublicUrl(fileName);

    return {
      success: 1,
      file: { url: urlData.publicUrl },
    };
  }, []);

  const uploadImageByUrl = useCallback(async (rawUrl: string) => {

    // 1) 공백/개행 제거
    const trimmed = rawUrl.trim();

    // 2) 프로토콜 생략 URL (//) → https: 보완
    const url = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

    // 3) data: / blob: → 브라우저에서 직접 처리
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
        const file = new File([blob], `paste-${Date.now()}.${ext}`, { type: blob.type });
        return uploadImage(file);
      } catch {
        return { success: 0, error: "Could not fetch local image" };
      }
    }

    // 4) http/https URL → 서버 프록시
    if (url.startsWith("http:") || url.startsWith("https:")) {
      const res = await fetch("/api/upload-image-by-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      return res.json();
    }

    // 5) 알 수 없는 scheme → 조용히 실패
    return { success: 0, error: "Unsupported URL scheme" };
  }, [uploadImage]);

  // Notion 붙여넣기 통합 핸들러 (캡처 단계로 Editor.js보다 먼저 실행)
  // 처리 대상: notionvc 주석 또는 attachment: URL 이 포함된 HTML (Notion 출처 판별)
  // 비노션 출처(구글 독스, 웹페이지 등)는 return → Editor.js 기본 동작 유지
  const handleNotionPaste = useCallback(async (event: Event) => {
    const clipEvent = event as ClipboardEvent;
    const html = clipEvent.clipboardData?.getData("text/html") || "";

    const isNotion = html.includes("notionvc:") || html.includes("attachment:");
    if (!isNotion) return;

    // 이미지 바이너리 파일 수집
    const imageFiles: File[] = [];
    for (const item of Array.from(clipEvent.clipboardData?.items ?? [])) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    // attachment: URL만 있고 바이너리도 없으며 notionvc도 없는 경우 → Editor.js에 위임
    // (텍스트는 유지되고 이미지 실패만 발생하는 기존 동작 유지)
    if (html.includes("attachment:") && imageFiles.length === 0 && !html.includes("notionvc:")) return;

    event.preventDefault();
    event.stopPropagation();

    const editor = editorRef.current;
    if (!editor) return;

    const doc = new DOMParser().parseFromString(html, "text/html");
    let imgIndex = 0;

    for (const node of Array.from(doc.body.childNodes)) {
      // HTML 주석(notionvc 등) 스킵
      if (node.nodeType === Node.COMMENT_NODE) continue;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent ?? "").trim();
        if (text) editor.blocks.insert("paragraph", { text });
        continue;
      }
      if (!(node instanceof Element)) continue;

      const tag = node.tagName.toLowerCase();

      if (tag === "p") {
        // attachment: 이미지가 <p> 안에 있는 경우
        const imgEl = node.tagName === "IMG"
          ? node
          : node.querySelector("img[src^='attachment:']");

        if (imgEl && imageFiles[imgIndex]) {
          const file = imageFiles[imgIndex++];
          const result = await uploadImage(file);
          if (result.success === 1) {
            editor.blocks.insert("image", {
              file: { url: result.file.url },
              caption: imgEl.getAttribute("alt") || "",
              withBorder: false,
              withBackground: false,
              stretched: false,
            });
          }
          imgEl.remove();
          const remaining = node.innerHTML.trim();
          // 남은 텍스트도 \n → <br> 정규화
          if (remaining) editor.blocks.insert("paragraph", { text: remaining.replace(/\n/g, "<br>") });
        } else {
          // 핵심 수정: <p> 안의 \n을 <br>로 치환해 contenteditable 커서 오동작 방지
          const content = node.innerHTML.replace(/\n/g, "<br>");
          if (content.trim()) editor.blocks.insert("paragraph", { text: content });
        }
      } else if (tag === "ul" || tag === "ol") {
        // @editorjs/list v1.10: items는 { content: string, items: [] }[] (nested list format)
        // :scope > li 로 직접 자식만 선택해 중첩 li 중복 방지
        const items = Array.from(node.querySelectorAll(":scope > li")).map((li) => ({
          content: li.innerHTML,
          items: [],
        }));
        if (items.length > 0) {
          editor.blocks.insert("list", {
            style: tag === "ol" ? "ordered" : "unordered",
            items,
          });
        }
      } else if (/^h[1-6]$/.test(tag)) {
        // 에디터 설정이 level 2~3만 허용하므로 클램프
        const level = Math.min(Math.max(parseInt(tag[1]), 2), 3);
        editor.blocks.insert("header", { text: node.innerHTML, level });
      } else {
        // 그 외 태그 → 텍스트가 있으면 paragraph로 fallback
        const text = node.innerHTML.trim();
        if (text) editor.blocks.insert("paragraph", { text });
      }
    }
  }, [uploadImage]);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    holder.addEventListener("paste", handleNotionPaste, true);
    return () => holder.removeEventListener("paste", handleNotionPaste, true);
  }, [handleNotionPaste]);

  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: "모임을 상세하게 소개해주세요...",
      data: initialData as any,
      inlineToolbar: ["bold", "italic", "link"],
      tools: {
        alignmentBlockTune: {
          class: AlignmentBlockTune as any,
          config: { default: "left" },
        },
        imageSizeTune: {
          class: ImageSizeTune as any,
        },
        paragraph: {
          class: Paragraph as any,
          inlineToolbar: true,
          tunes: ["alignmentBlockTune"],
        },
        header: {
          class: Header as any,
          config: { levels: [2, 3], defaultLevel: 2 },
          inlineToolbar: true,
          tunes: ["alignmentBlockTune"],
        },
        list: {
          class: List as any,
          inlineToolbar: true,
        },
        delimiter: { class: Delimiter as any },
        image: {
          class: ImageTool as any,
          config: {
            uploader: {
              uploadByFile: uploadImage,
              uploadByUrl: uploadImageByUrl,
            },
          },
          tunes: ["imageSizeTune"],
        },
      },
      onChange: async () => {
        if (editorRef.current) {
          const data = await editorRef.current.save();
          onChange?.(data as EditorJSContent);
        }
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={holderRef}
      className="min-h-[300px] border rounded-lg p-4 bg-white prose prose-gray max-w-none [&_.ce-block__content]:max-w-none [&_.ce-toolbar__content]:max-w-none"
    />
  );
}
