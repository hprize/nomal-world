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
