"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { slug: "all", name: "전체" },
  { slug: "outdoor", name: "아웃도어" },
  { slug: "culture", name: "문화·예술" },
  { slug: "food", name: "맛집·카페" },
  { slug: "sports", name: "운동·스포츠" },
  { slug: "study", name: "스터디" },
  { slug: "hobby", name: "취미" },
  { slug: "social", name: "소셜" },
  { slug: "travel", name: "여행" },
];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = searchParams.get("category") || "all";

  const handleSelect = (slug: string) => {
    if (slug === "all") {
      router.push("/");
    } else {
      router.push(`/?category=${slug}`);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => handleSelect(cat.slug)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected === cat.slug
              ? "bg-primary-600 text-white"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
