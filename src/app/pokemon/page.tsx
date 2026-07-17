import type { Metadata } from "next";
import { roster } from "@/lib/data/pokemon";
import { RosterList } from "@/components/RosterList";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "포켓몬 도감",
  description: "포켓몬 챔피언스에 등장하는 포켓몬 로스터와 능력치, 타입 정보.",
};

export default function PokemonListPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <PageHeader
        titleKey="home.dexTitle"
        subtitleKey="dex.pageSubtitle"
        subtitleVars={{ n: roster.length }}
      />

      <RosterList pokemon={roster} />
    </main>
  );
}
