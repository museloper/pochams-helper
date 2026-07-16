import type { Metadata } from "next";
import { roster } from "@/lib/data/pokemon";
import { SpeedCalculator } from "@/components/SpeedCalculator";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "스피드 계산기",
  description:
    "포켓몬 챔피언스 스피드 라인 계산기. 성격과 노력치에 따라 최저속·최속·구애스카프 기준으로 추월하지 못하는 포켓몬을 확인하세요.",
};

export default function SpeedPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <PageHeader titleKey="speed.pageTitle" subtitleKey="speed.pageSubtitle" />

      <SpeedCalculator pokemon={roster} />
    </main>
  );
}
