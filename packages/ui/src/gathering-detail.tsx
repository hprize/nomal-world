import * as React from "react";
import { Badge } from "./components/badge";
import { ContentRenderer } from "./content-renderer";
import { formatCost, formatDate } from "./lib/utils";
import type { GatheringWithCategory } from "@nestly/db/types";
import { Calendar, MapPin, Users, Banknote } from "lucide-react";

interface GatheringDetailProps {
  gathering: GatheringWithCategory;
  showApplyButton?: boolean;
  showEditButton?: boolean;
  onApply?: () => void;
  onEdit?: () => void;
}

export function GatheringDetail({
  gathering,
  showApplyButton = false,
  showEditButton = false,
  onApply,
  onEdit,
}: GatheringDetailProps) {
  return (
    <div className="pb-24">
      {/* Hero Image */}
      {gathering.thumbnail_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={gathering.thumbnail_url}
            alt={gathering.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full bg-muted flex items-center justify-center">
          <span className="text-6xl">🎉</span>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Basic Info */}
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

        {/* Details Grid */}
        <section className="py-6 border-b grid grid-cols-2 gap-4">
          {gathering.date && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">날짜</p>
                <p className="text-sm font-medium">{formatDate(gathering.date)}</p>
              </div>
            </div>
          )}
          {gathering.location && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">장소</p>
                <p className="text-sm font-medium">{gathering.location}</p>
              </div>
            </div>
          )}
          {gathering.capacity && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">인원</p>
                <p className="text-sm font-medium">{gathering.capacity}명</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">비용</p>
              <p className="text-sm font-medium">{formatCost(gathering.cost)}</p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <h2 className="text-lg font-bold mb-4">소개</h2>
          {gathering.content ? (
            <ContentRenderer content={gathering.content} />
          ) : (
            <p className="text-muted-foreground">소개 내용이 없습니다.</p>
          )}
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      {(showApplyButton || showEditButton) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
          <div className="max-w-3xl mx-auto flex gap-3">
            {showEditButton && (
              <button
                onClick={onEdit}
                className="flex-1 border border-primary-600 text-primary-600 font-semibold py-3 px-6 rounded-xl hover:bg-primary-50 transition-colors"
              >
                편집하기
              </button>
            )}
            {showApplyButton && (
              <button
                onClick={onApply}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                신청하기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
