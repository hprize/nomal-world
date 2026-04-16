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

    const supabase = createClient();
    supabase
      .from("gathering_events")
      .insert({ gathering_id: gatheringId, event_type: "view" })
      .then(() => {
        sessionStorage.setItem(key, "1");
      });
  }, [gatheringId]);

  return null;
}
