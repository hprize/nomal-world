import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerClient } from "@nomal-world/db/server";
import { GatheringForm } from "@/components/gathering-form";
import type { Category } from "@nomal-world/db/types";

export const dynamic = "force-dynamic";

export default async function CreateGatheringPage() {
  let categories: Category[] = [];

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    categories = (data as Category[]) || [];
  } catch {
    // Supabase not configured
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold">새로운 모임 생성</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <GatheringForm mode="create" categories={categories} />
      </div>
    </main>
  );
}
