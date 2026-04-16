import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomal World 호스트 - 모임 관리",
  description: "Nomal World 모임을 만들고 관리하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
