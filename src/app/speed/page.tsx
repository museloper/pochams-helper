import type { Metadata } from "next";
import Link from "next/link";
import { roster } from "@/lib/data/pokemon";
import { SpeedCalculator } from "@/components/SpeedCalculator";

export const metadata: Metadata = {
  title: "스피드 계산기",
  description:
    "포켓몬 챔피언스 스피드 라인 계산기. 성격과 노력치에 따라 최저속·최속·구애스카프 기준으로 추월하지 못하는 포켓몬을 확인하세요.",
};

export default function SpeedPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ← 홈
        </Link>
        <h1 className="mt-2 text-2xl font-bold">스피드 계산기</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lv50 기준 · 성격과 노력치(0~32)를 조절해 추월하지 못하는 상대를
          그룹별로 확인하세요.
        </p>
      </header>

      <SpeedCalculator pokemon={roster} />
    </main>
  );
}
