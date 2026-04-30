import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "노말월드: 말도 안 되는 우리만의 세상",
  description: "관심사가 비슷한 사람들과 함께하는 소셜 모임 플랫폼",
  openGraph: {
    title: "노말월드: 말도 안 되는 우리만의 세상",
    description: "관심사가 비슷한 사람들과 함께하는 소셜 모임 플랫폼",
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
