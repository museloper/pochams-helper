import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { roster } from "@/lib/data/pokemon";
import { moves as moveDict } from "@/lib/data/moves";
import type { Move } from "@/lib/types";
import { MoveList } from "@/components/MoveList";
import { FormPanel } from "@/components/FormPanel";

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

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <Link
        href="/pokemon"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        ← 도감
      </Link>

      <div className="mt-4 space-y-4">
        {pokemon.forms.map((form) => (
          <FormPanel key={form.name} form={form} />
        ))}
      </div>

      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
          배울 수 있는 기술 ({learnable.length})
        </h3>
        <MoveList moves={learnable} />
      </section>
    </main>
  );
}
