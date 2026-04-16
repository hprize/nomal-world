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
    supabase
      .from("gathering_events")
      .insert({ gathering_id: gatheringId, event_type: "apply_click" });
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
