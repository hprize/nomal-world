import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nestly - 새로운 모임을 발견하세요",
  description: "관심사가 비슷한 사람들과 함께하는 소셜 모임 플랫폼",
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
