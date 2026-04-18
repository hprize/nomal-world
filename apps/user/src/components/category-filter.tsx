"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { slug: "all", name: "전체" },
  { slug: "photo-video", name: "사진 · 영상" },
  { slug: "music-performance", name: "음악 · 공연" },
  { slug: "art-design-craft", name: "미술 · 디자인 · 만들기" },
  { slug: "writing-reading", name: "글쓰기 · 독서 · 인문" },
  { slug: "fandom", name: "취향 · 덕질" },
  { slug: "sports", name: "스포츠 · 신체활동" },
  { slug: "game", name: "게임 · 두뇌" },
  { slug: "food-baking", name: "음식 · 베이킹" },
  { slug: "fashion-beauty", name: "패션 · 뷰티" },
  { slug: "healing", name: "힐링 · 마음" },
  { slug: "social", name: "관계 · 친목" },
  { slug: "career-growth", name: "진로 · 공부 · 성장" },
  { slug: "recreation", name: "레크레이션 · 놀이" },
  { slug: "challenge", name: "대회 · 챌린지" },
];

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") || "all";

  // 클릭 즉시 UI 반영 (서버 응답 전에도 선택된 것처럼 보임)
  const [optimistic, setOptimistic] = useState<string | null>(null);
  const selected = optimistic ?? urlCategory;

  // 네비게이션 완료 후 optimistic 상태 초기화
  useEffect(() => {
    setOptimistic(null);
  }, [urlCategory]);

  const handleSelect = (slug: string) => {
    setOptimistic(slug);
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
