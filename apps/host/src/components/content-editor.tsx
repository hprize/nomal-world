"use client";

import { useEffect, useRef, useCallback } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
import Delimiter from "@editorjs/delimiter";
import ImageTool from "@editorjs/image";
import { createClient } from "@nestly/db/client";
import type { EditorJSContent } from "@nestly/db/types";

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

  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: "모임을 상세하게 소개해주세요...",
      data: initialData as any,
      tools: {
        header: {
          class: Header as any,
          config: { levels: [2, 3], defaultLevel: 2 },
        },
        paragraph: { class: Paragraph as any },
        list: { class: List as any },
        delimiter: { class: Delimiter as any },
        image: {
          class: ImageTool as any,
          config: {
            uploader: {
              uploadByFile: uploadImage,
            },
          },
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
