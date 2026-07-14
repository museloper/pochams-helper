"use client";

import { useMemo, useState } from "react";
import type { Ability, Move, Pokemon, PokemonType, StatKey } from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/types";
import {
  EV_MAX,
  damageRolls,
  hpValue,
  koVerdict,
  statValue,
  withStage,
  type StatNature,
} from "@/lib/damage";
import { effectiveness } from "@/lib/typeChart";
import {
  ATTACKER_ITEMS,
  DEFENDER_ITEMS,
  abilityMods,
  combineMods,
  itemIconUrl,
  itemMods,
  type ItemOption,
  type ModContext,
} from "@/lib/battleModifiers";
import { moves as moveDict } from "@/lib/data/moves";
import { asset } from "@/lib/basePath";
import { TypeBadge } from "@/components/TypeBadge";

type Unit = {
  key: string;
  slug: string;
  ko: string;
  en: string;
  sprite: string;
  types: PokemonType[];
  base: Record<StatKey, number>;
  abilities: Ability[];
  damagingMoves: Move[];
  isMega: boolean;
};

/** "Rough Skin" -> "rough-skin"; "Dragon's Maw" -> "dragons-maw". */
function abilitySlug(en: string): string {
  return en
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const NATURES: { value: StatNature; label: string }[] = [
  { value: "plus", label: "상승" },
  { value: "neutral", label: "무보정" },
  { value: "minus", label: "하락" },
];

// A mega Pokémon must hold its Mega Stone, so its item is fixed.
const MEGA_STONE_ITEMS: ItemOption[] = [{ id: "mega-stone", ko: "메가스톤" }];

function useUnits(pokemon: Pokemon[]): Unit[] {
  return useMemo(
    () =>
      pokemon.flatMap((entry) => {
        const damagingMoves = entry.learnableMoves
          .map((s) => moveDict[s])
          .filter((m): m is Move => Boolean(m) && m.category !== "status")
          .sort((a, b) => a.ko.localeCompare(b.ko));
        const nonMega = entry.forms.filter((f) => f.kind !== "mega");
        const megas = entry.forms.filter((f) => f.kind === "mega");
        const shown = nonMega.length > 0 ? [nonMega[0], ...megas] : megas;
        return shown.map((form) => ({
          key: `${entry.slug}|${form.name}`,
          slug: entry.slug,
          ko: form.names.ko,
          en: form.names.en,
          sprite: form.sprite,
          types: form.types,
          base: form.baseStats,
          abilities: form.abilities,
          damagingMoves,
          isMega: form.kind === "mega",
        }));
      }),
    [pokemon],
  );
}

function PokemonSearch({
  units,
  selectedKey,
  onSelect,
  placeholder,
}: {
  units: Unit[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
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
  return (
    <div className="relative">
      {selected && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.sprite}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <span className="text-lg font-semibold">{selected.ko}</span>
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={selected ? selected.ko : placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900"
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {results.map((u) => (
            <li key={u.key}>
              <button
                type="button"
                onClick={() => {
                  onSelect(u.key);
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NatureToggle({
  value,
  onChange,
}: {
  value: StatNature;
  onChange: (v: StatNature) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
      {NATURES.map((n) => (
        <button
          key={n.value}
          type="button"
          onClick={() => onChange(n.value)}
          className={
            value === n.value
              ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
              : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}

function EvSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={EV_MAX}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-rose-500"
      />
      <span className="w-12 shrink-0 text-right text-xs text-gray-500 tabular-nums dark:text-gray-400">
        {value}/{EV_MAX}
      </span>
    </div>
  );
}

function AbilityToggle({
  abilities,
  idx,
  onChange,
}: {
  abilities: Ability[];
  idx: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        특성
      </span>
      <div className="inline-flex flex-wrap justify-end gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
        {abilities.map((a, i) => (
          <button
            key={a.en}
            type="button"
            onClick={() => onChange(i)}
            className={
              idx === i
                ? "rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                : "rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }
          >
            {a.ko}
            {a.hidden && " (드림)"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemIcon({ icon }: { icon?: string }) {
  if (!icon) return <span className="inline-block h-6 w-6 shrink-0" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={itemIconUrl(icon)}
      alt=""
      width={24}
      height={24}
      loading="lazy"
      className="h-6 w-6 shrink-0 object-contain"
    />
  );
}

/** Custom dropdown so held-item options can show their icons. */
function ItemSelect({
  items,
  value,
  onChange,
}: {
  items: ItemOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((it) => it.id === value) ?? items[0];
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        도구
      </span>
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1 text-left text-xs dark:border-gray-600 dark:bg-gray-900"
        >
          <ItemIcon icon={selected.icon} />
          <span className="min-w-0 flex-1 truncate">{selected.ko}</span>
          <span className="shrink-0 text-gray-400">▾</span>
        </button>
        {open && (
          <ul className="absolute right-0 z-10 mt-1 max-h-64 w-max min-w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(it.id);
                    setOpen(false);
                  }}
                  className={
                    it.id === value
                      ? "flex w-full items-center gap-1.5 bg-gray-100 px-2 py-1.5 text-left text-xs dark:bg-gray-800"
                      : "flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                >
                  <ItemIcon icon={it.icon} />
                  <span className="whitespace-nowrap">{it.ko}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StageSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {label} 랭크
      </span>
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
    </div>
  );
}

export function DamageCalculator({ pokemon }: { pokemon: Pokemon[] }) {
  const units = useUnits(pokemon);

  const [attackerKey, setAttackerKey] = useState<string | null>(null);
  const [moveSlug, setMoveSlug] = useState<string | null>(null);
  const [moveQuery, setMoveQuery] = useState("");
  const [moveTypeFilter, setMoveTypeFilter] = useState<PokemonType | null>(
    null,
  );
  const [moveListOpen, setMoveListOpen] = useState(true);
  const [atkNature, setAtkNature] = useState<StatNature>("plus");
  const [atkEv, setAtkEv] = useState(EV_MAX);
  const [atkItem, setAtkItem] = useState("");
  const [atkAbilityIdx, setAtkAbilityIdx] = useState(0);
  const [atkStage, setAtkStage] = useState(0);

  const [defenderKey, setDefenderKey] = useState<string | null>(null);
  const [defNature, setDefNature] = useState<StatNature>("neutral");
  const [hpEv, setHpEv] = useState(0);
  const [defEv, setDefEv] = useState(0);
  const [defItem, setDefItem] = useState("");
  const [defAbilityIdx, setDefAbilityIdx] = useState(0);
  const [defStage, setDefStage] = useState(0);

  const attacker = units.find((u) => u.key === attackerKey) ?? null;
  const defender = units.find((u) => u.key === defenderKey) ?? null;
  const move =
    (attacker && moveSlug
      ? attacker.damagingMoves.find((m) => m.slug === moveSlug)
      : null) ?? null;

  // Types the attacker actually has damaging moves of (for the move filter).
  const moveTypes = attacker
    ? POKEMON_TYPES.filter((t) =>
        attacker.damagingMoves.some((m) => m.type === t),
      )
    : [];
  const q = moveQuery.trim().toLowerCase();
  const filteredMoves = attacker
    ? attacker.damagingMoves.filter(
        (m) =>
          (moveTypeFilter === null || m.type === moveTypeFilter) &&
          (!q ||
            m.ko.toLowerCase().includes(q) ||
            m.en.toLowerCase().includes(q)),
      )
    : [];

  const physical = move?.category === "physical";
  const atkLabel = physical ? "공격" : "특공";
  const defLabel = physical ? "방어" : "특방";

  // Effective stats.
  const attack = move
    ? statValue(
        physical ? attacker!.base.atk : attacker!.base.spa,
        atkEv,
        atkNature,
      )
    : 0;
  const defenseStat =
    move && defender
      ? statValue(
          physical ? defender.base.def : defender.base.spd,
          defEv,
          defNature,
        )
      : 0;
  const hp = defender ? hpValue(defender.base.hp, hpEv) : 0;

  const atkAbility = attacker?.abilities[atkAbilityIdx] ?? null;
  const defAbility = defender?.abilities[defAbilityIdx] ?? null;

  const stab = !!(move && attacker && attacker.types.includes(move.type));
  const baseTypeEff =
    move && defender ? effectiveness(move.type, defender.types) : 1;

  // Combine held-item and ability modifiers.
  const mods =
    move && defender
      ? combineMods([
          itemMods(atkItem, {
            category: move.category,
            moveType: move.type,
            power: move.power ?? 0,
            typeEff: baseTypeEff,
          } satisfies ModContext),
          itemMods(defItem, {
            category: move.category,
            moveType: move.type,
            power: move.power ?? 0,
            typeEff: baseTypeEff,
          } satisfies ModContext),
          abilityMods(
            atkAbility ? abilitySlug(atkAbility.en) : "",
            "attacker",
            {
              category: move.category,
              moveType: move.type,
              power: move.power ?? 0,
              typeEff: baseTypeEff,
            },
          ),
          abilityMods(
            defAbility ? abilitySlug(defAbility.en) : "",
            "defender",
            {
              category: move.category,
              moveType: move.type,
              power: move.power ?? 0,
              typeEff: baseTypeEff,
            },
          ),
        ])
      : null;

  const typeEff = mods?.immune ? 0 : baseTypeEff;
  const stabMult = stab ? (mods?.stabMult ?? 1.5) : 1;

  const canCompute = !!(move && defender && move.power && move.power > 0);
  const rolls =
    canCompute && mods
      ? damageRolls({
          power: move!.power!,
          attack: Math.floor(withStage(attack, atkStage) * mods.atkMult),
          defense: Math.floor(withStage(defenseStat, defStage) * mods.defMult),
          stabMult,
          typeEff,
          powerMult: mods.powerMult,
          finalMult: mods.finalMult,
        })
      : [];
  const min = rolls.length ? Math.min(...rolls) : 0;
  const max = rolls.length ? Math.max(...rolls) : 0;
  const verdict = rolls.length ? koVerdict(rolls, hp) : null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Attacker */}
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="mb-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            공격
          </h2>
          <PokemonSearch
            units={units}
            selectedKey={attackerKey}
            onSelect={(k) => {
              setAttackerKey(k);
              setMoveSlug(null);
              setMoveQuery("");
              setMoveTypeFilter(null);
              setMoveListOpen(true);
              setAtkAbilityIdx(0);
              setAtkItem(
                units.find((u) => u.key === k)?.isMega ? "mega-stone" : "",
              );
            }}
            placeholder="공격 포켓몬 검색…"
          />

          {attacker && (
            <div className="mt-3 space-y-3">
              {moveListOpen ? (
                <>
                  {/* Move type filter */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setMoveTypeFilter(null)}
                      className={
                        moveTypeFilter === null
                          ? "flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-[10px] font-medium text-white dark:bg-white dark:text-gray-900"
                          : "flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-[10px] text-gray-500 hover:border-gray-400 dark:border-gray-700"
                      }
                    >
                      전체
                    </button>
                    {moveTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setMoveTypeFilter(moveTypeFilter === t ? null : t)
                        }
                        aria-pressed={moveTypeFilter === t}
                        className={
                          moveTypeFilter === t
                            ? "rounded-md ring-2 ring-gray-900 dark:ring-white"
                            : "rounded-md opacity-90 hover:opacity-100"
                        }
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset(`/types/${t}.png`)}
                          alt={t}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-md"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Optional search */}
                  <input
                    type="text"
                    value={moveQuery}
                    onChange={(e) => setMoveQuery(e.target.value)}
                    placeholder="기술 이름 검색 (선택)…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-900"
                  />

                  {/* Move list */}
                  <ul className="max-h-56 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                    {filteredMoves.map((m) => (
                      <li key={m.slug}>
                        <button
                          type="button"
                          onClick={() => {
                            setMoveSlug(m.slug);
                            setMoveListOpen(false);
                          }}
                          className={
                            moveSlug === m.slug
                              ? "flex w-full items-center gap-2 bg-rose-50 px-3 py-1.5 text-left text-sm dark:bg-rose-900/30"
                              : "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                        >
                          <TypeBadge type={m.type} />
                          <span className="min-w-0 flex-1 truncate">
                            {m.ko}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {m.category === "physical" ? "물리" : "특수"} ·{" "}
                            {m.power ?? "—"}
                          </span>
                        </button>
                      </li>
                    ))}
                    {filteredMoves.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-gray-400">
                        해당 기술이 없습니다
                      </li>
                    )}
                  </ul>
                </>
              ) : (
                move && (
                  // Collapsed: selected move summary (click to re-open the list).
                  <button
                    type="button"
                    onClick={() => setMoveListOpen(true)}
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 dark:border-gray-600"
                  >
                    <TypeBadge type={move.type} />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {move.ko}
                    </span>
                    {stab && (
                      <span className="shrink-0 text-xs text-rose-500">
                        자속
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400">
                      {physical ? "물리" : "특수"} · {move.power ?? "—"}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      변경 ▾
                    </span>
                  </button>
                )
              )}

              {move && (
                <>
                  <EvSlider
                    label={`${atkLabel} 노력치`}
                    value={atkEv}
                    onChange={setAtkEv}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {atkLabel} 성격
                    </span>
                    <NatureToggle value={atkNature} onChange={setAtkNature} />
                  </div>
                  <StageSelect
                    label={atkLabel}
                    value={atkStage}
                    onChange={setAtkStage}
                  />
                </>
              )}

              <AbilityToggle
                abilities={attacker.abilities}
                idx={atkAbilityIdx}
                onChange={setAtkAbilityIdx}
              />
              <ItemSelect
                items={attacker.isMega ? MEGA_STONE_ITEMS : ATTACKER_ITEMS}
                value={atkItem}
                onChange={setAtkItem}
              />
            </div>
          )}
        </section>

        {/* Defender */}
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="mb-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
            방어
          </h2>
          <PokemonSearch
            units={units}
            selectedKey={defenderKey}
            onSelect={(k) => {
              setDefenderKey(k);
              setDefAbilityIdx(0);
              setDefItem(
                units.find((u) => u.key === k)?.isMega ? "mega-stone" : "",
              );
            }}
            placeholder="방어 포켓몬 검색…"
          />

          {defender && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1">
                {defender.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <EvSlider label="HP 노력치" value={hpEv} onChange={setHpEv} />
              <EvSlider
                label={`${move ? defLabel : "방어/특방"} 노력치`}
                value={defEv}
                onChange={setDefEv}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {move ? defLabel : "내구"} 성격
                </span>
                <NatureToggle value={defNature} onChange={setDefNature} />
              </div>
              <StageSelect
                label={move ? defLabel : "방어"}
                value={defStage}
                onChange={setDefStage}
              />
              <AbilityToggle
                abilities={defender.abilities}
                idx={defAbilityIdx}
                onChange={setDefAbilityIdx}
              />
              <ItemSelect
                items={defender.isMega ? MEGA_STONE_ITEMS : DEFENDER_ITEMS}
                value={defItem}
                onChange={setDefItem}
              />
            </div>
          )}
        </section>
      </div>

      {/* Result */}
      {attacker && move && defender && (
        <div className="mt-6 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          {canCompute ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    데미지 (HP 대비)
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {((min / hp) * 100).toFixed(1)}% ~{" "}
                    {((max / hp) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {min} ~ {max} 데미지 · 상대 HP {hp}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={
                      verdict?.label === "확정 1타"
                        ? "text-2xl font-bold text-rose-600 dark:text-rose-400"
                        : "text-2xl font-bold"
                    }
                  >
                    {verdict?.label}
                    {verdict?.chance !== undefined && (
                      <span className="ml-1 text-base">
                        {(verdict.chance * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    타입 상성 ×{typeEff}
                    {stab && " · 자속"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3 dark:border-gray-800">
                <div>
                  <div className="text-xs text-gray-400">{atkLabel} 실수치</div>
                  <div className="font-semibold tabular-nums">{attack}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">상대 HP 실수치</div>
                  <div className="font-semibold tabular-nums">{hp}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">{defLabel} 실수치</div>
                  <div className="font-semibold tabular-nums">
                    {defenseStat}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              이 기술은 위력이 고정/가변이라 표준 데미지 계산을 할 수 없습니다.
            </p>
          )}
        </div>
      )}

      {!(attacker && move && defender) && (
        <p className="mt-6 text-sm text-gray-400">
          공격 포켓몬과 기술, 방어 포켓몬을 선택하면 데미지와 확정/난수 1타
          여부를 계산합니다.
        </p>
      )}
    </div>
  );
}
