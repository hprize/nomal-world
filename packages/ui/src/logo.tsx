import * as React from "react";
import LogoIcon from "./assets/logo-icon.svg";
import LogoText from "./assets/logo-text.svg";

interface LogoProps {
  /** 아이콘만 표시 (사이드바 축소 등에 활용) */
  iconOnly?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({
  iconOnly = false,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className={iconClassName ?? "h-8 w-8 lg:h-10 lg:w-10"}>
        <LogoIcon width="100%" height="100%" />
      </div>
      {!iconOnly && (
        <div className={textClassName ?? "h-8 w-32 lg:h-10 lg:w-40"}>
          <LogoText width="100%" height="100%" />
        </div>
      )}
    </div>
  );
}
