import type { Metadata } from "next";
import Link from "next/link";
import { roster } from "@/lib/data/pokemon";
import { RosterList } from "@/components/RosterList";

export const metadata: Metadata = {
  title: "포켓몬 도감",
  description: "포켓몬 챔피언스에 등장하는 포켓몬 로스터와 능력치, 타입 정보.",
};

export default function PokemonListPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ← 홈
        </Link>
        <h1 className="mt-2 text-2xl font-bold">포켓몬 도감</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          포켓몬 챔피언스 로스터 {roster.length}종 · 종족값 총합 기준
        </p>
      </header>

      <RosterList pokemon={roster} />
    </main>
  );
}
