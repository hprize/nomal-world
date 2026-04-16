import * as React from "react";
import { cn, formatCost, formatDate } from "./lib/utils";
import { Badge } from "./components/badge";
import type { GatheringWithCategory } from "@nomal-world/db/types";
import { Calendar, MapPin, Users } from "lucide-react";

interface GatheringCardProps {
  gathering: GatheringWithCategory;
  href?: string;
  onClick?: () => void;
  showStatus?: boolean;
}

export function GatheringCard({
  gathering,
  href,
  onClick,
  showStatus = false,
}: GatheringCardProps) {
  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      className={cn(
        "group bg-card",
        (href || onClick) && "cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-xl">
        {gathering.thumbnail_url ? (
          <img
            src={gathering.thumbnail_url}
            alt={gathering.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-4xl">🎉</span>
          </div>
        )}
        {showStatus && (
          <div className="absolute top-3 right-3">
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
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-3 space-y-2">
        {gathering.category && (
          <Badge variant="default">{gathering.category.name}</Badge>
        )}
        <h3 className="font-semibold text-base line-clamp-2">
          {gathering.title}
        </h3>
        {gathering.summary && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {gathering.summary}
          </p>
        )}
        <div className="flex flex-col gap-1 pt-1 text-sm text-muted-foreground">
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
        <div className="flex items-center justify-between pt-2 border-t">
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
