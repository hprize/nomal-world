import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCost(cost: number): string {
  if (cost === 0) return "무료";
  return `${cost.toLocaleString("ko-KR")}원`;
}

// 표시 타임존 고정: 서버(Vercel = UTC)에서 렌더링해도 한국 날짜가 나오도록 한다.
// (없으면 KST 새벽 시각이 전날 날짜로 표시됨)
const APP_TIME_ZONE = "Asia/Seoul";

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "모집 종료 후 논의";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    timeZone: APP_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function formatRecruitmentPeriod(
  start: string | null,
  end: string | null
): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", { timeZone: APP_TIME_ZONE, month: "numeric", day: "numeric" });
  if (start && end) return `${fmt(start)} ~ ${fmt(end)}`;
  if (end) return `~ ${fmt(end)}`;
  if (start) return `${fmt(start)} ~`;
  return "";
}

export function getDdayCount(recruitmentEnd: string | null): number | null {
  if (!recruitmentEnd) return null;
  const diffDays = Math.ceil(
    (new Date(recruitmentEnd).getTime() - Date.now()) / 86_400_000
  );
  return diffDays >= 0 && diffDays <= 7 ? diffDays : null;
}
