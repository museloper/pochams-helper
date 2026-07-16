"use client";

import { useMemo, useState } from "react";
import type { LocalizedName, Pokemon, PokemonType } from "@/lib/types";
import type { SpeedNature } from "@/lib/speed";
import {
  EV_MAX,
  SPEED_NATURES,
  maxSpeed,
  minSpeed,
  scarfSpeed,
  speedStat,
  subMaxSpeed,
  withScarf,
  withStage,
} from "@/lib/speed";
import { weaknesses } from "@/lib/typeChart";
import { moves as moveDict } from "@/lib/data/moves";
import { useLanguage } from "@/stores/useLanguage";
import { useT, type TranslationKey } from "@/lib/i18n";
import { TypeBadge } from "@/components/TypeBadge";

const NATURE_KEYS: Record<SpeedNature, TranslationKey> = {
  plus: "speed.naturePlus",
  neutral: "speed.natureNeutral",
  minus: "speed.natureMinus",
};

type Unit = {
  key: string;
  slug: string;
  names: LocalizedName;
  sprite: string;
  spe: number;
  isMega: boolean;
  /** Defensive typing of this form (for weakness lookup). */
  types: PokemonType[];
  /** Types this species has a damaging move of (for the weakness-move filter). */
  attackTypes: PokemonType[];
};

const GROUPS: {
  key: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  noteKey?: TranslationKey;
  speed: (base: number) => number;
  allowMega: boolean;
}[] = [
  {
    key: "min",
    labelKey: "speed.group.min",
    descKey: "speed.group.minDesc",
    speed: minSpeed,
    allowMega: true,
  },
  {
    key: "submax",
    labelKey: "speed.group.submax",
    descKey: "speed.group.submaxDesc",
    speed: subMaxSpeed,
    allowMega: true,
  },
  {
    key: "max",
    labelKey: "speed.group.max",
    descKey: "speed.group.maxDesc",
    speed: maxSpeed,
    allowMega: true,
  },
  {
    key: "scarf",
    labelKey: "speed.group.scarf",
    descKey: "speed.group.scarfDesc",
    noteKey: "speed.group.scarfNote",
    speed: scarfSpeed,
    allowMega: false,
  },
];

function useUnits(pokemon: Pokemon[]): Unit[] {
  return useMemo(
    () =>
      pokemon.flatMap((entry) => {
        // Types of the species' damaging (non-status) learnable moves.
        const attackTypes = [
          ...new Set(
            entry.learnableMoves
              .map((slug) => moveDict[slug])
              .filter((m) => m && m.category !== "status")
              .map((m) => m.type),
          ),
        ];
        const nonMega = entry.forms.filter((f) => f.kind !== "mega");
        const megas = entry.forms.filter((f) => f.kind === "mega");
        const shown = nonMega.length > 0 ? [nonMega[0], ...megas] : megas;
        return shown.map((form) => ({
          key: `${entry.slug}|${form.name}`,
          slug: entry.slug,
          names: form.names,
          sprite: form.sprite,
          spe: form.baseStats.spe,
          isMega: form.kind === "mega",
          types: form.types,
          attackTypes,
        }));
      }),
    [pokemon],
  );
}

/** Compact −/+ stepper for a speed stat stage (rank, -6..+6). */
function StageStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(-6, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm hover:border-gray-400 dark:border-gray-700"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-medium tabular-nums">
        {value > 0 ? `+${value}` : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(6, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm hover:border-gray-400 dark:border-gray-700"
      >
        +
      </button>
    </div>
  );
}

export function SpeedCalculator({ pokemon }: { pokemon: Pokemon[] }) {
  const units = useUnits(pokemon);
  const lang = useLanguage((s) => s.lang);
  const t = useT();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [nature, setNature] = useState<SpeedNature>("neutral");
  const [ev, setEv] = useState(EV_MAX);
  const [scarf, setScarf] = useState(false);
  const [myStage, setMyStage] = useState(0);
  const [oppStage, setOppStage] = useState(0);
  const [target, setTarget] = useState("");
  const [weakOnly, setWeakOnly] = useState(false);

  const selected = units.find((u) => u.key === selectedKey) ?? null;
  const results = query.trim()
    ? units
        .filter(
          (u) =>
            u.names.ko.includes(query) ||
            u.names.en.toLowerCase().includes(query.toLowerCase()) ||
            u.names.ja.includes(query),
        )
        .slice(0, 40)
    : [];

  const baseSpeed = selected ? speedStat(selected.spe, ev, nature) : null;
  // In-game order: stat-stage (rank, issue #3) first, then the Choice Scarf
  // ×1.5 item modifier (issue #2).
  const mySpeed =
    baseSpeed !== null
      ? (() => {
          const staged = withStage(baseSpeed, myStage);
          return scarf ? withScarf(staged) : staged;
        })()
      : null;

  const targetQuery = target.trim().toLowerCase();
  const matchesTarget = (u: Unit) =>
    !targetQuery ||
    u.names.ko.toLowerCase().includes(targetQuery) ||
    u.names.en.toLowerCase().includes(targetQuery) ||
    u.names.ja.toLowerCase().includes(targetQuery);

  // Attacking types the selected Pokémon is weak to (super-effective).
  const myWeaknesses = selected ? weaknesses(selected.types) : [];
  const hasWeaknessMove = (u: Unit) =>
    !weakOnly || u.attackTypes.some((t) => myWeaknesses.includes(t));

  const groups = GROUPS.map((g) => {
    const list =
      selected && mySpeed !== null
        ? units
            .filter((u) => u.key !== selected.key && (g.allowMega || !u.isMega))
            .filter(matchesTarget)
            .filter(hasWeaknessMove)
            .map((u) => ({ u, s: withStage(g.speed(u.spe), oppStage) }))
            .filter((x) => x.s >= mySpeed)
            .sort((a, b) => a.s - b.s)
        : [];
    return { ...g, list };
  });

  return (
    <div>
      {/* Pokémon picker */}
      <label className="mb-1 block text-sm font-medium">
        {t("speed.myPokemon")}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            selected ? selected.names[lang] : t("speed.searchPokemon")
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {results.map((u) => (
              <li key={u.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKey(u.key);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.sprite}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                  />
                  <span className="flex-1">{u.names[lang]}</span>
                  <span className="text-xs text-gray-400">
                    {t("speed.speedN", { n: u.spe })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.sprite}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <div>
              <div className="font-semibold">{selected.names[lang]}</div>
              <div className="text-xs text-gray-400">
                {t("speed.baseSpeedN", { n: selected.spe })}
              </div>
            </div>
          </div>

          {/* Nature */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              {t("speed.nature")}
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
              {SPEED_NATURES.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  onClick={() => setNature(n.value)}
                  className={
                    nature === n.value
                      ? "rounded-md bg-gray-900 px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                      : "rounded-md px-3 py-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  }
                >
                  {t(NATURE_KEYS[n.value])}
                </button>
              ))}
            </div>
          </div>

          {/* EV slider */}
          <div className="min-w-52 flex-1">
            <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t("speed.ev")}</span>
              <span className="tabular-nums">
                {ev} / {EV_MAX}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={EV_MAX}
              value={ev}
              onChange={(e) => setEv(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Choice Scarf toggle (my own item) */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              {t("speed.scarf")}
            </div>
            <button
              type="button"
              onClick={() => setScarf((v) => !v)}
              aria-pressed={scarf}
              className={
                scarf
                  ? "rounded-lg bg-violet-600 px-3 py-1 text-sm font-medium text-white"
                  : "rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:border-gray-400 dark:border-gray-700 dark:hover:text-gray-200"
              }
            >
              {t(scarf ? "speed.scarfOn" : "speed.scarfOff")}
            </button>
          </div>

          {/* My speed rank (stat stage) */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              {t("speed.myRank")}
            </div>
            <StageStepper value={myStage} onChange={setMyStage} />
          </div>

          {/* Result */}
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t("speed.mySpeed")}
            </div>
            <div className="text-2xl font-bold tabular-nums">{mySpeed}</div>
            {(scarf || myStage !== 0) && (
              <div className="text-xs text-violet-500">
                {[
                  myStage !== 0
                    ? t("speed.rankNote", {
                        rank: myStage > 0 ? `+${myStage}` : myStage,
                      })
                    : null,
                  scarf ? `${t("speed.scarf")} ×1.5` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                {t("speed.baseNote", { base: baseSpeed ?? 0 })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weaknesses + filters */}
      {selected && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="mr-1 text-gray-500 dark:text-gray-400">
              {t("speed.weakTypes")}
            </span>
            {myWeaknesses.length > 0 ? (
              myWeaknesses.map((wt) => <TypeBadge key={wt} type={wt} />)
            ) : (
              <span className="text-gray-400">{t("speed.none")}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={t("speed.targetSearch")}
              className="min-w-52 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => setWeakOnly((v) => !v)}
              disabled={myWeaknesses.length === 0}
              className={
                weakOnly
                  ? "rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                  : "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
              }
            >
              {t("speed.weakOnly")}
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("speed.oppRank")}
              </span>
              <StageStepper value={oppStage} onChange={setOppStage} />
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      {selected && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div
              key={g.key}
              className="rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{t(g.labelKey)}</span>
                  <span className="text-xs text-gray-400">
                    {t("speed.countN", { n: g.list.length })}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {t("speed.cantOutrun", { desc: t(g.descKey) })}
                </div>
                {/* Always render this line so all four headers align in height. */}
                <div className="mt-0.5 text-[11px] text-gray-400">
                  {g.noteKey ? t(g.noteKey) : " "}
                </div>
              </div>
              <ul className="max-h-96 divide-y divide-gray-100 overflow-auto dark:divide-gray-800">
                {g.list.map(({ u, s }) => (
                  <li
                    key={u.key}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.sprite}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {u.names[lang]}
                    </span>
                    {s === mySpeed && (
                      <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {t("speed.tie")}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                      {s}
                    </span>
                  </li>
                ))}
                {g.list.length === 0 && (
                  <li className="px-3 py-3 text-center text-xs text-gray-400">
                    {t(
                      targetQuery ? "speed.filteredOutrun" : "speed.allOutrun",
                    )}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!selected && (
        <p className="mt-6 text-sm text-gray-400">{t("speed.emptyState")}</p>
      )}
    </div>
  );
}
