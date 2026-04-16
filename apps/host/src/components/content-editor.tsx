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

  // macOS attachment: URL 붙여넣기 전용 핸들러 (캡처 단계로 Editor.js보다 먼저 실행)
  const handleAttachmentPaste = useCallback(async (event: Event) => {
    const clipEvent = event as ClipboardEvent;
    const html = clipEvent.clipboardData?.getData("text/html") || "";
    if (!html.includes("attachment:")) return; // attachment: 없으면 Editor.js가 처리

    // preventDefault 전에 파일 수집 — 바이너리 없으면 Editor.js에 위임
    const imageFiles: File[] = [];
    for (const item of Array.from(clipEvent.clipboardData?.items ?? [])) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    // Notion 블록 복사 시 이미지 바이너리가 clipboard에 없는 경우:
    // Editor.js에 위임하면 uploadByUrl("attachment:...")를 시도하다 실패하지만
    // 텍스트는 유지되고 사용자가 이미지 실패를 인식할 수 있음
    if (imageFiles.length === 0) return;

    event.preventDefault();
    event.stopPropagation();

    const editor = editorRef.current;
    if (!editor) return;

    // HTML을 파싱해 블록 순서대로 처리
    const doc = new DOMParser().parseFromString(html, "text/html");
    let imgIndex = 0;

    for (const node of Array.from(doc.body.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) editor.blocks.insert("paragraph", { text });
        continue;
      }
      if (!(node instanceof Element)) continue;

      const imgEl =
        node.tagName === "IMG" ? node : node.querySelector("img[src^='attachment:']");

      if (imgEl) {
        const file = imageFiles[imgIndex++];
        if (file) {
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
        }
        // 같은 블록 안의 나머지 텍스트 처리
        imgEl.remove();
        const remaining = (node as Element).innerHTML.trim();
        if (remaining) editor.blocks.insert("paragraph", { text: remaining });
      } else {
        const text = (node as Element).innerHTML.trim();
        if (text) editor.blocks.insert("paragraph", { text });
      }
    }
  }, [uploadImage]);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    holder.addEventListener("paste", handleAttachmentPaste, true);
    return () => holder.removeEventListener("paste", handleAttachmentPaste, true);
  }, [handleAttachmentPaste]);

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
