import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCost(cost: number): string {
  if (cost === 0) return "무료";
  return `${cost.toLocaleString("ko-KR")}원`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "모집 종료 후 논의";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
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
    new Date(d).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
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
