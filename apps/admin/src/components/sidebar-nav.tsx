"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/gatherings", label: "모임 관리" },
  { href: "/users", label: "사용자 관리" },
  { href: "/stats", label: "통계" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col flex-1">
      <nav className="space-y-1">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-white text-gray-900 font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-gray-700">
        <LogoutButton />
      </div>
    </div>
  );
}
