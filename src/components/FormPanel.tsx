"use client";

import type { Language, PokemonForm, StatKey } from "@/lib/types";
import { STAT_KEYS } from "@/lib/types";
import { useLanguage } from "@/stores/useLanguage";
import { TypeBadge } from "@/components/TypeBadge";

const STAT_LABEL: Record<StatKey, string> = {
  hp: "HP",
  atk: "공격",
  def: "방어",
  spa: "특수공격",
  spd: "특수방어",
  spe: "스피드",
};
// Per-stat bar colors (H·A·B·C·D·S), the conventional Pokémon stat palette.
const STAT_COLOR: Record<StatKey, string> = {
  hp: "#EF5350",
  atk: "#FF8A3D",
  def: "#FBC02D",
  spa: "#5C9DF5",
  spd: "#66BB6A",
  spe: "#EC5D9E",
};
// Bar scaling; base stats rarely exceed this, values above just fill the bar.
const STAT_MAX = 200;

const OTHER_LANGS: Record<Language, Language[]> = {
  ko: ["en", "ja"],
  en: ["ko", "ja"],
  ja: ["ko", "en"],
};

function bst(form: PokemonForm): number {
  return STAT_KEYS.reduce((sum, key) => sum + form.baseStats[key], 0);
}

export function FormPanel({ form }: { form: PokemonForm }) {
  const lang = useLanguage((s) => s.lang);
  return (
    <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={form.sprite}
          alt={form.names[lang]}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{form.names[lang]}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {OTHER_LANGS[lang].map((l) => form.names[l]).join(" · ")}
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
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STAT_COLOR[key],
                    }}
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
              key={ability.en}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-sm dark:border-gray-700"
              title={ability.en}
            >
              {ability[lang]}
              {ability.hidden && (
                <span className="rounded bg-purple-100 px-1 text-[10px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  드림
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
