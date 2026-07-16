import type { Metadata } from "next";
import { roster } from "@/lib/data/pokemon";
import { DamageCalculator } from "@/components/DamageCalculator";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "데미지 계산기",
  description:
    "포켓몬 챔피언스 데미지 계산기. 공격 포켓몬·기술·노력치와 방어 포켓몬·내구를 입력하면 데미지 퍼센트와 확정/난수 1타를 계산합니다.",
};

export default function DamagePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <PageHeader
        titleKey="damage.pageTitle"
        subtitleKey="damage.pageSubtitle"
      />

      <DamageCalculator pokemon={roster} />
    </main>
  );
}
