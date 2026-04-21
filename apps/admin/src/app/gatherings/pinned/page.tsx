import { createServerClient } from "@nomal-world/db/server";
import { PinnedGatheringsManager } from "@/components/pinned-gatherings-manager";

export const dynamic = "force-dynamic";

interface GatheringItem {
  id: string;
  title: string;
  status: string;
  is_pinned: boolean;
  pin_order: number;
  host: { name: string | null; email: string } | null;
  category: { name: string } | null;
}

export default async function PinnedGatheringsPage() {
  let pinnedGatherings: GatheringItem[] = [];
  let availableGatherings: GatheringItem[] = [];

  try {
    const supabase = createServerClient();

    // 고정된 모임 (pin_order 순)
    const { data: pinned } = await supabase
      .from("gatherings")
      .select("id, title, status, is_pinned, pin_order, host:profiles(name, email), category:categories(name)")
      .eq("is_pinned", true)
      .order("pin_order", { ascending: true });

    pinnedGatherings = (pinned as unknown as GatheringItem[]) || [];

    // 고정 가능한 모임 (공개 상태 & 미고정)
    const { data: available } = await supabase
      .from("gatherings")
      .select("id, title, status, is_pinned, pin_order, host:profiles(name, email), category:categories(name)")
      .eq("status", "published")
      .eq("is_pinned", false)
      .order("created_at", { ascending: false });

    availableGatherings = (available as unknown as GatheringItem[]) || [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">고정 모임 관리</h1>
      <PinnedGatheringsManager
        pinnedGatherings={pinnedGatherings}
        availableGatherings={availableGatherings}
      />
    </div>
  );
}
