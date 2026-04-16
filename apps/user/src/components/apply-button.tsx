"use client";

import { createClient } from "@nomal-world/db/client";

interface ApplyButtonProps {
  gatheringId: string;
  url: string;
  className?: string;
  children: React.ReactNode;
}

export function ApplyButton({ gatheringId, url, className, children }: ApplyButtonProps) {
  const handleClick = () => {
    const supabase = createClient();
    // .then()으로 Promise 실행을 트리거 — 없으면 Supabase 쿼리 빌더가 실행되지 않음
    supabase
      .from("gathering_events")
      .insert({ gathering_id: gatheringId, event_type: "apply_click" })
      .then();
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
