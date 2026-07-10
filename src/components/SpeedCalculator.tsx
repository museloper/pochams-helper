"use client";

import { useMemo, useState } from "react";
import type { Pokemon, PokemonType } from "@/lib/types";
import type { SpeedNature } from "@/lib/speed";
import {
  EV_MAX,
  SPEED_NATURES,
  maxSpeed,
  minSpeed,
  scarfSpeed,
  speedStat,
  subMaxSpeed,
} from "@/lib/speed";
import { weaknesses } from "@/lib/typeChart";
import { moves as moveDict } from "@/lib/data/moves";
import { TypeBadge } from "@/components/TypeBadge";

type Unit = {
  key: string;
  slug: string;
  ko: string;
  en: string;
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
  label: string;
  desc: string;
  note?: string;
  speed: (base: number) => number;
  allowMega: boolean;
}[] = [
  {
    key: "min",
    label: "최저속",
    desc: "0 노력치 · -스피드",
    speed: minSpeed,
    allowMega: true,
  },
  {
    key: "submax",
    label: "준속",
    desc: "32 노력치 · 무보정",
    speed: subMaxSpeed,
    allowMega: true,
  },
  {
    key: "max",
    label: "최속",
    desc: "32 노력치 · +스피드",
    speed: maxSpeed,
    allowMega: true,
  },
  {
    key: "scarf",
    label: "구애스카프",
    desc: "준속 × 1.5",
    note: "준속 상태에서 구애스카프 적용 기준",
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
          ko: form.names.ko,
          en: form.names.en,
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

export function SpeedCalculator({ pokemon }: { pokemon: Pokemon[] }) {
  const units = useUnits(pokemon);
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [nature, setNature] = useState<SpeedNature>("neutral");
  const [ev, setEv] = useState(EV_MAX);
  const [target, setTarget] = useState("");
  const [weakOnly, setWeakOnly] = useState(false);

  const selected = units.find((u) => u.key === selectedKey) ?? null;
  const results = query.trim()
    ? units
        .filter(
          (u) =>
            u.ko.includes(query) ||
            u.en.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 40)
    : [];

  const mySpeed = selected ? speedStat(selected.spe, ev, nature) : null;

  const targetQuery = target.trim().toLowerCase();
  const matchesTarget = (u: Unit) =>
    !targetQuery ||
    u.ko.toLowerCase().includes(targetQuery) ||
    u.en.toLowerCase().includes(targetQuery);

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
            .map((u) => ({ u, s: g.speed(u.spe) }))
            .filter((x) => x.s >= mySpeed)
            .sort((a, b) => a.s - b.s)
        : [];
    return { ...g, list };
  });

  return (
    <div>
      {/* Pokémon picker */}
      <label className="mb-1 block text-sm font-medium">내 포켓몬</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selected ? selected.ko : "포켓몬 이름 검색…"}
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
                  <span className="flex-1">{u.ko}</span>
                  <span className="text-xs text-gray-400">스피드 {u.spe}</span>
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
              <div className="font-semibold">{selected.ko}</div>
              <div className="text-xs text-gray-400">
                종족값 스피드 {selected.spe}
              </div>
            </div>
          </div>

          {/* Nature */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              성격
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
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* EV slider */}
          <div className="min-w-52 flex-1">
            <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>스피드 노력치</span>
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

          {/* Result */}
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              내 스피드
            </div>
            <div className="text-2xl font-bold tabular-nums">{mySpeed}</div>
          </div>
        </div>
      )}

      {/* Weaknesses + filters */}
      {selected && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="mr-1 text-gray-500 dark:text-gray-400">
              약점 타입
            </span>
            {myWeaknesses.length > 0 ? (
              myWeaknesses.map((t) => <TypeBadge key={t} type={t} />)
            ) : (
              <span className="text-gray-400">없음</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="타겟 포켓몬 검색 (그룹에서 필터)…"
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
              약점 공격기 보유만
            </button>
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
                  <span className="font-semibold">{g.label}</span>
                  <span className="text-xs text-gray-400">
                    {g.list.length}마리
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {g.desc} 상대를 추월 못 함
                </div>
                {/* Always render this line so all four headers align in height. */}
                <div className="mt-0.5 text-[11px] text-gray-400">
                  {g.note ?? " "}
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
                    <span className="min-w-0 flex-1 truncate">{u.ko}</span>
                    {s === mySpeed && (
                      <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        동속
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                      {s}
                    </span>
                  </li>
                ))}
                {g.list.length === 0 && (
                  <li className="px-3 py-3 text-center text-xs text-gray-400">
                    {targetQuery ? "이 기준에선 추월 가능" : "전부 추월 가능"}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!selected && (
        <p className="mt-6 text-sm text-gray-400">
          포켓몬을 선택하면 최저속·최속·구애스카프 기준으로 추월하지 못하는
          상대를 보여줍니다.
        </p>
      )}
    </div>
  );
}
