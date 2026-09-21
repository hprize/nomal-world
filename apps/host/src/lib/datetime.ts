/**
 * 날짜·시간 입력 변환 유틸.
 *
 * 서비스는 한국 오프라인 모임 대상이므로 폼 입력(datetime-local)과 표시는 Asia/Seoul 기준으로 고정한다.
 * 브라우저·서버(Vercel = UTC) 타임존에 관계없이 같은 문자열이 나오므로 SSR 하이드레이션도 일치한다.
 *
 * 주의: `new Date(iso).toISOString().slice(0, 16)`은 UTC 문자열이라 datetime-local에 넣으면
 * 9시간 앞선 값이 보이고, 그대로 재저장하면 매번 9시간씩 밀리는 버그가 있었다.
 */
export const APP_TIME_ZONE = "Asia/Seoul";
const APP_UTC_OFFSET = "+09:00"; // 한국은 서머타임이 없어 고정 오프셋

const localFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** DB의 timestamptz(ISO 문자열) → `<input type="datetime-local">` 값 ("YYYY-MM-DDTHH:mm", KST) */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const p: Record<string, string> = {};
  for (const part of localFormatter.formatToParts(date)) {
    if (part.type !== "literal") p[part.type] = part.value;
  }
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** `<input type="datetime-local">` 값(KST) → ISO(UTC) 문자열. 빈 값·형식 오류는 null */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  const seconds = value.length === 16 ? ":00" : "";
  const date = new Date(`${value}${seconds}${APP_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
