import * as React from "react";
import Image from "next/image";
import type { EditorJSContent } from "@nomal-world/db/types";

interface ContentRendererProps {
  content: EditorJSContent;
}

function getAlignment(block: EditorJSContent["blocks"][number]): string {
  const alignment = (block.tunes as any)?.alignmentBlockTune?.alignment;
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

export function ContentRenderer({ content }: ContentRendererProps) {
  if (!content?.blocks?.length) {
    return (
      <p className="text-muted-foreground text-center py-8">
        소개 내용이 없습니다.
      </p>
    );
  }

  return (
    <div className="prose prose-gray max-w-none space-y-4">
      {content.blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={index}
                className={`text-base leading-relaxed ${getAlignment(block)}`}
                dangerouslySetInnerHTML={{
                  __html: (block.data.text as string) || "",
                }}
              />
            );

          case "header": {
            const level = (block.data.level as number) || 2;
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag
                key={index}
                className={`${
                  level === 1
                    ? "text-2xl font-bold"
                    : level === 2
                    ? "text-xl font-bold"
                    : "text-lg font-semibold"
                } ${getAlignment(block)}`}
                dangerouslySetInnerHTML={{
                  __html: (block.data.text as string) || "",
                }}
              />
            );
          }

          case "image": {
            const file = block.data.file as { url: string } | undefined;
            const url = file?.url || (block.data.url as string);
            const caption = block.data.caption as string;
            const width = (block.tunes as any)?.imageSizeTune?.width as string | undefined;
            const hasSizeConstraint = width && width !== "100%";
            // http(s) URL만 렌더링. 업로드되지 못한 임시(blob:) URL 등은 다른 브라우저에서 열 수 없어
            // 깨진 이미지 아이콘만 남으므로 블록 자체를 건너뛴다.
            if (typeof url !== "string" || !/^https?:\/\//.test(url)) return null;
            // Supabase Storage 공개 URL만 next/image 최적화 대상(next.config의 remotePatterns).
            // 그 외 호스트는 최적화 서버가 거부하므로 원본을 그대로 쓴다.
            const isStorageUrl = url.includes("/storage/v1/object/public/");
            return (
              <figure
                key={index}
                className="my-6"
                style={hasSizeConstraint ? { maxWidth: width, margin: "0 auto" } : undefined}
              >
                <Image
                  src={url}
                  alt={caption || ""}
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="w-full h-auto"
                  unoptimized={!isStorageUrl}
                />
                {caption && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-2">
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "list": {
            const items = (block.data.items as string[]) || [];
            const style = block.data.style as string;
            const ListTag = style === "ordered" ? "ol" : "ul";
            return (
              <ListTag
                key={index}
                className={
                  style === "ordered"
                    ? "list-decimal pl-6 space-y-1"
                    : "list-disc pl-6 space-y-1"
                }
              >
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="text-base"
                    dangerouslySetInnerHTML={{ __html: item }}
                  />
                ))}
              </ListTag>
            );
          }

          case "delimiter":
            return (
              <hr key={index} className="my-8 border-t border-border" />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
