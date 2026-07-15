import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { LanguageToggle } from "@/components/LanguageToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "포켓몬 챔피언스 헬퍼",
    template: "%s | 포켓몬 챔피언스 헬퍼",
  },
  description:
    "포켓몬 챔피언스 대전을 위한 팀 빌딩, 상성 계산, 데미지 계산 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/90 px-6 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
            <Link href="/" className="text-sm font-semibold">
              포켓몬 챔피언스 헬퍼
            </Link>
            <LanguageToggle />
          </header>
          {children}
        </Providers>
        <footer className="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
          <p>
            포켓몬 챔피언스 헬퍼는 닌텐도 · 게임프리크 · 포켓몬 컴퍼니와 무관한
            비공식 팬 프로젝트입니다.
          </p>
          <p className="mt-1">
            Pokémon 및 관련 이미지 · 명칭의 저작권은 각 권리자에게 있습니다.
          </p>
        </footer>
      </body>
    </html>
  );
}
