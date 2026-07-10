import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { roster } from "@/lib/data/pokemon";
import type { PokemonForm, StatKey } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { TypeBadge } from "@/components/TypeBadge";

const STAT_LABEL: Record<StatKey, string> = {
  hp: "HP",
  atk: "공격",
  def: "방어",
  spa: "특수공격",
  spd: "특수방어",
  spe: "스피드",
};
// Bar scaling; base stats rarely exceed this, values above just fill the bar.
const STAT_MAX = 200;

function bst(form: PokemonForm): number {
  return STAT_KEYS.reduce((sum, key) => sum + form.baseStats[key], 0);
}

function humanizeMove(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

function FormPanel({ form }: { form: PokemonForm }) {
  return (
    <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={form.sprite}
          alt={form.names.ko}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{form.names.ko}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {form.names.en} · {form.names.ja}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {form.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            종족값
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            총합 {bst(form)}
          </span>
        </div>
        <dl className="space-y-1.5">
          {STAT_KEYS.map((key) => {
            const value = form.baseStats[key];
            const pct = Math.min(100, (value / STAT_MAX) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <dt className="w-16 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {STAT_LABEL[key]}
                </dt>
                <dd className="w-8 shrink-0 text-right text-sm tabular-nums">
                  {value}
                </dd>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
          특성
        </h3>
        <div className="flex flex-wrap gap-2">
          {form.abilities.map((ability) => (
            <span
              key={ability}
              className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm dark:border-gray-700"
            >
              {ability}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pokemon = roster.find((p) => p.slug === slug);
  if (!pokemon) notFound();

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
        <h3 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
          배울 수 있는 기술 ({pokemon.learnableMoves.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {pokemon.learnableMoves.map((move) => (
            <span
              key={move}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {humanizeMove(move)}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
