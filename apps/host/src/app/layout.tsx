import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "노말월드 호스트 - 모임 관리",
  description: "노말월드 모임을 만들고 관리하세요",
  openGraph: {
    title: "노말월드 호스트 - 모임 관리",
    description: "노말월드 모임을 만들고 관리하세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
