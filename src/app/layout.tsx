import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteBrand, SiteFooter } from "@/components/SiteChrome";

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
        {/* Privacy-friendly, cookie-less pageview analytics (goatcounter.com). */}
        <Script
          data-goatcounter="https://pochams-helper.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
        <Providers>
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/90 px-6 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
            <SiteBrand />
            <LanguageToggle />
          </header>
          {children}
        </Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
