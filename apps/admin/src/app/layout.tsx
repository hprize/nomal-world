import type { Metadata } from "next";
import { Logo } from "@nomal-world/ui/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomal World 관리자",
  description: "Nomal World 관리자 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white p-6 hidden md:flex md:flex-col">
            <div className="mb-8 bg-white rounded-xl p-3 inline-flex">
              <Logo iconClassName="h-8 w-8" textClassName="h-8 w-32" />
            </div>
            <SidebarNav />
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
