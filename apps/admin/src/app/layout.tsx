import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nestly 관리자",
  description: "Nestly 관리자 대시보드",
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
          <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
            <h1 className="text-xl font-bold mb-8">Nestly 관리자</h1>
            <nav className="space-y-2">
              <Link
                href="/"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/gatherings"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                모임 관리
              </Link>
              <Link
                href="/users"
                className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                사용자 관리
              </Link>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
