import * as React from "react";
import type { EditorJSContent } from "@nestly/db/types";

interface ContentRendererProps {
  content: EditorJSContent;
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
                className="text-base leading-relaxed"
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
                className={
                  level === 1
                    ? "text-2xl font-bold"
                    : level === 2
                    ? "text-xl font-bold"
                    : "text-lg font-semibold"
                }
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
            return (
              <figure key={index} className="my-6">
                {url && (
                  <img
                    src={url}
                    alt={caption || ""}
                    className="w-full rounded-lg"
                  />
                )}
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
