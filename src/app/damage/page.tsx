import type { Metadata } from "next";
import Link from "next/link";
import { roster } from "@/lib/data/pokemon";
import { DamageCalculator } from "@/components/DamageCalculator";

export const metadata: Metadata = {
  title: "데미지 계산기",
  description:
    "포켓몬 챔피언스 데미지 계산기. 공격 포켓몬·기술·노력치와 방어 포켓몬·내구를 입력하면 데미지 퍼센트와 확정/난수 1타를 계산합니다.",
};

export default function DamagePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ← 홈
        </Link>
        <h1 className="mt-2 text-2xl font-bold">데미지 계산기</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lv50 기준 · 공격/방어 포켓몬과 기술·노력치를 입력해 데미지와 확정·난수
          1타를 확인하세요.
        </p>
      </header>

      <DamageCalculator pokemon={roster} />
    </main>
  );
}
