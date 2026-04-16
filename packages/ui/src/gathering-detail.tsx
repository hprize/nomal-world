import * as React from "react";
import { Badge } from "./components/badge";
import { ContentRenderer } from "./content-renderer";
import { formatCost, formatDate } from "./lib/utils";
import type { GatheringWithCategory } from "@nomal-world/db/types";
import { Calendar, MapPin, Users, Banknote } from "lucide-react";

interface GatheringDetailProps {
  gathering: GatheringWithCategory;
  /** 데스크탑 우측 카드에 표시할 편집 링크 (host용) */
  editHref?: string;
  /** 편집 버튼 아래 추가 액션 (host용 - 공개/비공개 전환 등) */
  actionsSlot?: React.ReactNode;
  /** 신청하기 버튼 슬롯 — 클릭 추적이 필요한 경우 주입 (user용) */
  applySlot?: React.ReactNode;
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function GatheringDetail({ gathering, editHref, actionsSlot, applySlot }: GatheringDetailProps) {
  const hasDesktopCta = gathering.google_form_url || editHref;

  return (
    <div className="pb-8">

      {/* ── Mobile / Tablet: 풀 너비 이미지 ── */}
      <div className="lg:hidden aspect-[16/9] w-full overflow-hidden bg-muted">
        {gathering.thumbnail_url ? (
          <img
            src={gathering.thumbnail_url}
            alt={gathering.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🎉</span>
          </div>
        )}
      </div>

      {/* ── Mobile / Tablet: 기본 정보 + 상세 정보 ── */}
      <div className="lg:hidden max-w-3xl mx-auto px-4">
        <section className="py-6 border-b">
          {gathering.category && (
            <Badge variant="default" className="mb-3">
              {gathering.category.name}
            </Badge>
          )}
          <h1 className="text-2xl font-bold mb-2">{gathering.title}</h1>
          {gathering.summary && (
            <p className="text-muted-foreground">{gathering.summary}</p>
          )}
        </section>

        <section className="py-6 border-b grid grid-cols-2 gap-4">
          <DetailItem
            icon={<Calendar className="w-5 h-5 text-primary-600" />}
            label="날짜"
            value={formatDate(gathering.date)}
          />
          {gathering.location && (
            <DetailItem
              icon={<MapPin className="w-5 h-5 text-primary-600" />}
              label="장소"
              value={gathering.location}
            />
          )}
          {gathering.capacity && (
            <DetailItem
              icon={<Users className="w-5 h-5 text-primary-600" />}
              label="인원"
              value={`${gathering.capacity}명`}
            />
          )}
          <DetailItem
            icon={<Banknote className="w-5 h-5 text-primary-600" />}
            label="비용"
            value={formatCost(gathering.cost)}
          />
        </section>
      </div>

      {/* ── Desktop: 2열 레이아웃 ── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start lg:pt-8">

          {/* 왼쪽: 이미지 + 소개글 */}
          <div>
            <div className="hidden lg:block aspect-[16/9] w-full overflow-hidden bg-muted rounded-sm mb-8">
              {gathering.thumbnail_url ? (
                <img
                  src={gathering.thumbnail_url}
                  alt={gathering.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎉</span>
                </div>
              )}
            </div>

            <section className="max-w-3xl mx-auto px-4 lg:px-0 py-8 border-t">
              <h2 className="text-lg font-bold mb-4">소개</h2>
              {gathering.content ? (
                <ContentRenderer content={gathering.content} />
              ) : (
                <p className="text-muted-foreground">소개 내용이 없습니다.</p>
              )}
            </section>
          </div>

          {/* 오른쪽: 떠다니는 정보 카드 (데스크탑 전용) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white border rounded-xl p-6 space-y-4">
              {gathering.category && (
                <Badge variant="default">{gathering.category.name}</Badge>
              )}
              <h1 className="text-xl font-bold leading-snug">{gathering.title}</h1>
              {gathering.summary && (
                <p className="text-sm text-muted-foreground">{gathering.summary}</p>
              )}

              <div className="border-t pt-4 space-y-3">
                {gathering.date && (
                  <DetailItem
                    icon={<Calendar className="w-5 h-5 text-primary-600" />}
                    label="날짜"
                    value={formatDate(gathering.date)}
                  />
                )}
                {gathering.location && (
                  <DetailItem
                    icon={<MapPin className="w-5 h-5 text-primary-600" />}
                    label="장소"
                    value={gathering.location}
                  />
                )}
                {gathering.capacity && (
                  <DetailItem
                    icon={<Users className="w-5 h-5 text-primary-600" />}
                    label="인원"
                    value={`${gathering.capacity}명`}
                  />
                )}
                <DetailItem
                  icon={<Banknote className="w-5 h-5 text-primary-600" />}
                  label="비용"
                  value={formatCost(gathering.cost)}
                />
              </div>

              {hasDesktopCta && (
                <div className="border-t pt-4 flex flex-col gap-2">
                  {editHref && (
                    <a
                      href={editHref}
                      className="block w-full border border-primary-600 text-primary-600 font-semibold py-3 px-6 rounded-xl hover:bg-primary-50 transition-colors text-center"
                    >
                      편집하기
                    </a>
                  )}
                  {actionsSlot}
                  {applySlot ?? (gathering.google_form_url ? (
                    <a
                      href={gathering.google_form_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                    >
                      신청하기
                    </a>
                  ) : !editHref ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed"
                    >
                      신청 준비 중
                    </button>
                  ) : null)}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
