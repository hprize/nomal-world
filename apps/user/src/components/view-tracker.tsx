"use client";

import { useEffect } from "react";
import { createClient } from "@nomal-world/db/client";

interface ViewTrackerProps {
  gatheringId: string;
}

export function ViewTracker({ gatheringId }: ViewTrackerProps) {
  useEffect(() => {
    const key = `viewed_${gatheringId}`;
    if (sessionStorage.getItem(key)) return;

    // 비동기 insert 전에 먼저 키를 설정 —
    // StrictMode에서 effect가 두 번 실행되더라도 두 번째 실행에서 중복 방지
    sessionStorage.setItem(key, "1");

    const supabase = createClient();
    supabase
      .from("gathering_events")
      .insert({ gathering_id: gatheringId, event_type: "view" })
      .then();
  }, [gatheringId]);

  return null;
}
