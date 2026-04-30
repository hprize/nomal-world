import * as React from "react";
import Image from "next/image";
import { cn, formatCost, formatDate, getDdayCount } from "./lib/utils";
import { Badge } from "./components/badge";
import type { GatheringWithCategory } from "@nomal-world/db/types";
import { Calendar, MapPin, Users } from "lucide-react";

interface GatheringCardProps {
  gathering: GatheringWithCategory;
  href?: string;
  onClick?: () => void;
  showStatus?: boolean;
  isPinned?: boolean;
}

export function GatheringCard({
  gathering,
  href,
  onClick,
  showStatus = false,
  isPinned = false,
}: GatheringCardProps) {
  const Wrapper = href ? "a" : "div";
  const dday = getDdayCount(gathering.recruitment_end ?? null);

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      className={cn(
        "group bg-card flex flex-col",
        (href || onClick) && "cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-xl">
        {gathering.thumbnail_url ? (
          <Image
            src={gathering.thumbnail_url}
            alt={gathering.title}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-4xl">🎉</span>
          </div>
        )}
        {isPinned && (
          <div className="absolute top-3 left-3">
            <Badge variant="default" className="bg-white/80 backdrop-blur-sm text-gray-700 border-white/50">📌</Badge>
          </div>
        )}
        {(showStatus || dday !== null) && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {showStatus && (
              <Badge
                variant={
                  gathering.status === "published"
                    ? "success"
                    : gathering.status === "closed"
                    ? "destructive"
                    : "secondary"
                }
              >
                {gathering.status === "published"
                  ? "공개"
                  : gathering.status === "closed"
                  ? "마감"
                  : "초안"}
              </Badge>
            )}
            {dday !== null && (
              <Badge variant="destructive">
                {dday === 0 ? "D-Day" : `D-${dday}`}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3 flex flex-col flex-1 gap-2">
        {gathering.category && (
          <Badge variant="default" className="self-start">{gathering.category.name}</Badge>
        )}
        <h3 className="font-semibold text-base line-clamp-2">
          {gathering.title}
        </h3>
        {gathering.summary && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {gathering.summary}
          </p>
        )}
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(gathering.date)}</span>
          </div>
          {gathering.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{gathering.location}</span>
            </div>
          )}
        </div>
        {/* spacer: 가격/인원 영역을 카드 하단에 고정 */}
        <div className="flex-1" />
        <div className="pt-2 border-t flex items-center justify-between">
          <span className="font-semibold text-primary-600">
            {formatCost(gathering.cost)}
          </span>
          {gathering.capacity && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{gathering.capacity}명</span>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
