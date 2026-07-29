"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { HeaderButton } from "@nomal-world/db/types";

const MOBILE_QUERY = "(max-width: 639px)";

/**
 * 헤더 우측의 커스텀 버튼들을 메뉴로 접어 보여준다.
 * - 데스크톱(sm~): 메뉴 버튼 아래 오른쪽 정렬 드롭다운 (헤더 내부 absolute)
 * - 모바일(~sm): 화면 전체 오버레이 + 헤더 아래 full-width 시트 (body 포털)
 *
 * 포털을 쓰는 이유: 헤더의 `backdrop-blur`(backdrop-filter)가 position:fixed 자손의
 * 컨테이닝 블록이 되어, 헤더 안에서는 `fixed inset-0` 오버레이가 헤더 크기에 갇힌다.
 */
export function HeaderMenu({ buttons }: { buttons: HeaderButton[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sheetTop, setSheetTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  // 모바일 시트 위치를 메뉴 버튼 아래로 맞춘다 (헤더 높이가 바뀌어도 대응)
  const syncSheetTop = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setSheetTop(rect.bottom + 8);
  }, []);

  useEffect(() => {
    if (!open) return;
    syncSheetTop();

    const onPointerDown = (e: MouseEvent) => {
      // 메뉴 버튼 영역 클릭은 토글 버튼이 처리
      if (containerRef.current?.contains(e.target as Node)) return;
      // 시트/오버레이는 각자 onClick 으로 닫으므로 여기서는 데스크톱 바깥 클릭만 처리
      if ((e.target as HTMLElement).closest("[data-header-menu-portal]")) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", syncSheetTop);
    window.addEventListener("scroll", syncSheetTop, { passive: true });

    // 모바일에서 시트가 열려 있는 동안 배경 스크롤 잠금
    const isMobile = window.matchMedia(MOBILE_QUERY).matches;
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", syncSheetTop);
      window.removeEventListener("scroll", syncSheetTop);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, syncSheetTop]);

  if (buttons.length === 0) return null;

  const links = (variant: "desktop" | "mobile") =>
    buttons.map((btn) => (
      <a
        key={btn.id}
        href={btn.url}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={close}
        className={
          variant === "mobile"
            ? "flex items-center justify-center min-h-[44px] px-4 text-sm font-bold text-white rounded-lg transition-opacity active:opacity-70"
            : "block text-center text-sm font-bold text-white px-4 py-3 rounded-lg transition-opacity hover:opacity-80"
        }
        style={{ backgroundColor: btn.color }}
      >
        {btn.label}
      </a>
    ));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 h-11 px-3 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
        <span className="text-sm font-semibold hidden sm:inline">메뉴</span>
      </button>

      {/* 데스크톱: 헤더 내부 앵커드 드롭다운 */}
      {open && (
        <div
          role="menu"
          className="hidden sm:flex absolute right-0 top-full mt-2 z-50 origin-top-right
                     w-72 flex-col gap-1.5 rounded-xl border bg-white shadow-lg p-2"
        >
          {links("desktop")}
        </div>
      )}

      {/* 모바일: body 포털 (헤더의 backdrop-filter 영향을 받지 않도록) */}
      {open &&
        mounted &&
        createPortal(
          <div data-header-menu-portal className="sm:hidden">
            {/* 화면 전체 오버레이 */}
            <div
              className="fixed inset-0 z-[60] bg-black/40"
              aria-hidden="true"
              onClick={close}
            />
            {/* full-width 드롭다운 시트 */}
            <div
              role="menu"
              className="fixed inset-x-4 z-[61] max-h-[70vh] overflow-y-auto
                         rounded-2xl border bg-white shadow-xl p-2
                         flex flex-col gap-1.5"
              style={{ top: sheetTop }}
            >
              {links("mobile")}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
