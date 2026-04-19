"use client";

import { useEffect, useRef, useCallback } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
import Delimiter from "@editorjs/delimiter";
import ImageTool from "@editorjs/image";
import AlignmentBlockTune from "editorjs-text-alignment-blocktune";
// @ts-expect-error -- editorjs-undo has no type declarations
import Undo from "editorjs-undo";
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

  // 붙여넣기 통합 핸들러 (캡처 단계로 Editor.js보다 먼저 실행)
  // 모든 HTML 붙여넣기의 \n을 정규화해 contenteditable 커서 오동작 방지
  // HTML이 없는 순수 텍스트 붙여넣기는 Editor.js 기본 동작에 위임
  const handlePaste = useCallback(async (event: Event) => {
    const clipEvent = event as ClipboardEvent;
    const html = clipEvent.clipboardData?.getData("text/html") || "";

    // HTML이 없으면 Editor.js 기본 핸들러에 위임 (순수 텍스트)
    if (!html.trim()) return;

    // Notion 출처 판별 → 이미지 바이너리 수집
    const isNotion = html.includes("notionvc:") || html.includes("attachment:");
    const imageFiles: File[] = [];
    if (isNotion) {
      for (const item of Array.from(clipEvent.clipboardData?.items ?? [])) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      // attachment: URL만 있고 바이너리도 없으며 notionvc도 없는 경우 → Editor.js에 위임
      if (html.includes("attachment:") && imageFiles.length === 0 && !html.includes("notionvc:")) return;
    }

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

      // <hr> → delimiter 블록
      if (tag === "hr") {
        editor.blocks.insert("delimiter", {});
        continue;
      }

      // <img> → image 블록 (http/https URL만)
      if (tag === "img") {
        const src = node.getAttribute("src");
        if (src && (src.startsWith("http:") || src.startsWith("https:"))) {
          const result = await uploadImageByUrl(src);
          if (result.success === 1) {
            editor.blocks.insert("image", {
              file: { url: result.file.url },
              caption: node.getAttribute("alt") || "",
              withBorder: false,
              withBackground: false,
              stretched: false,
            });
          }
        }
        continue;
      }

      if (tag === "p") {
        // Notion attachment: 이미지가 <p> 안에 있는 경우
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
          if (remaining) editor.blocks.insert("paragraph", { text: remaining.replace(/\n/g, "<br>") });
        } else {
          // 비-Notion <img> 처리: <p> 안의 http(s) 이미지를 별도 블록으로 추출
          const embeddedImg = node.querySelector("img");
          if (embeddedImg) {
            const src = embeddedImg.getAttribute("src");
            if (src && (src.startsWith("http:") || src.startsWith("https:"))) {
              const result = await uploadImageByUrl(src);
              if (result.success === 1) {
                editor.blocks.insert("image", {
                  file: { url: result.file.url },
                  caption: embeddedImg.getAttribute("alt") || "",
                  withBorder: false,
                  withBackground: false,
                  stretched: false,
                });
              }
            }
            embeddedImg.remove();
          }
          // \n → <br> 치환해 contenteditable 커서 오동작 방지
          const content = node.innerHTML.replace(/\n/g, "<br>");
          if (content.trim()) editor.blocks.insert("paragraph", { text: content });
        }
      } else if (tag === "ul" || tag === "ol") {
        // @editorjs/list v1.10: items는 string[] (플러그인 API에 맞는 형식)
        // :scope > li 로 직접 자식만 선택해 중첩 li 중복 방지
        const items = Array.from(node.querySelectorAll(":scope > li"))
          .map((li) => li.innerHTML.replace(/\n/g, "<br>"));
        if (items.length > 0) {
          editor.blocks.insert("list", {
            style: tag === "ol" ? "ordered" : "unordered",
            items,
          });
        }
      } else if (/^h[1-6]$/.test(tag)) {
        // 에디터 설정이 level 2~3만 허용하므로 클램프
        const level = Math.min(Math.max(parseInt(tag[1]), 2), 3);
        editor.blocks.insert("header", { text: node.innerHTML.replace(/\n/g, "<br>"), level });
      } else {
        // 그 외 태그 → 텍스트가 있으면 paragraph로 fallback
        const text = node.innerHTML.replace(/\n/g, "<br>").trim();
        if (text) editor.blocks.insert("paragraph", { text });
      }
    }
  }, [uploadImage, uploadImageByUrl]);

  // 리스트 아이템 백스페이스 병합 핸들러
  // 커서가 리스트 아이템 맨 앞에 있을 때 백스페이스 → 이전 아이템과 병합 (노션 동작)
  const handleListBackspace = useCallback((event: Event) => {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key !== "Backspace") return;

    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || !selection.isCollapsed) return;

    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;

    // 현재 커서가 리스트 아이템 안에 있는지 확인
    const currentItem = anchorNode.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as Element).closest(".cdx-list__item")
      : anchorNode.parentElement?.closest(".cdx-list__item");
    if (!currentItem) return;

    // 커서가 아이템 맨 앞에 있는지 확인
    const range = selection.getRangeAt(0);
    const itemRange = document.createRange();
    itemRange.selectNodeContents(currentItem);
    itemRange.setEnd(range.startContainer, range.startOffset);
    if (itemRange.toString().length > 0) return;

    // 이전 형제 li가 있으면 병합
    const prevItem = currentItem.previousElementSibling;
    if (prevItem && prevItem.classList.contains("cdx-list__item")) {
      keyEvent.preventDefault();
      keyEvent.stopPropagation();

      // 현재 아이템의 내용을 이전 아이템 끝에 붙이기
      const currentHTML = currentItem.innerHTML;
      const prevLength = prevItem.textContent?.length ?? 0;

      // 커서 위치를 이전 아이템의 기존 텍스트 끝으로 설정하기 위해 마커 삽입
      const marker = document.createElement("span");
      marker.id = "__merge_cursor";
      prevItem.appendChild(marker);

      // 현재 아이템 내용을 이전 아이템에 병합
      prevItem.innerHTML = prevItem.innerHTML.replace('<span id="__merge_cursor"></span>', '') + currentHTML;
      currentItem.remove();

      // 커서를 병합 지점으로 이동
      // prevLength 위치에 커서 설정
      const setCursorAtOffset = (el: Node, offset: number) => {
        const sel = window.getSelection()!;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let pos = 0;
        let textNode: Node | null = null;
        while (walker.nextNode()) {
          textNode = walker.currentNode;
          const len = textNode.textContent?.length ?? 0;
          if (pos + len >= offset) {
            const newRange = document.createRange();
            newRange.setStart(textNode, offset - pos);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            return;
          }
          pos += len;
        }
        // offset이 전체 텍스트 길이를 초과하면 마지막에 커서
        if (textNode) {
          const newRange = document.createRange();
          newRange.setStart(textNode, textNode.textContent?.length ?? 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      };
      setCursorAtOffset(prevItem, prevLength);
    }
  }, []);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    holder.addEventListener("paste", handlePaste, true);
    holder.addEventListener("keydown", handleListBackspace, true);
    return () => {
      holder.removeEventListener("paste", handlePaste, true);
      holder.removeEventListener("keydown", handleListBackspace, true);
    };
  }, [handlePaste, handleListBackspace]);

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
      onReady: () => {
        new Undo({ editor });
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
