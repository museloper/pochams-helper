import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { roster } from "@/lib/data/pokemon";
import { moves as moveDict } from "@/lib/data/moves";
import { usageBySlug } from "@/lib/data/usage";
import type { Move } from "@/lib/types";
import { MoveList } from "@/components/MoveList";
import { FormPanel } from "@/components/FormPanel";
import { UsageSection } from "@/components/UsageSection";
import { DexBackLink, LearnableMovesHeading } from "@/components/DetailChrome";

export function generateStaticParams() {
  return roster.map((pokemon) => ({ slug: pokemon.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pokemon = roster.find((p) => p.slug === slug);
  if (!pokemon) return {};
  return {
    title: pokemon.names.ko,
    description: `${pokemon.names.ko}(${pokemon.names.en})의 종족값, 타입, 특성, 기술 정보.`,
  };
}

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pokemon = roster.find((p) => p.slug === slug);
  if (!pokemon) notFound();

  const learnable: Move[] = pokemon.learnableMoves
    .map((moveSlug) => moveDict[moveSlug])
    .filter((move): move is Move => Boolean(move));
  const usage = usageBySlug[pokemon.slug];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <DexBackLink />

      <div className="mt-4 space-y-4">
        {pokemon.forms.map((form) => (
          <FormPanel key={form.name} form={form} />
        ))}
      </div>

      {usage && <UsageSection pokemon={pokemon} usage={usage} />}

      <section className="mt-6">
        <LearnableMovesHeading count={learnable.length} />
        <MoveList moves={learnable} />
      </section>
    </main>
  );
}
