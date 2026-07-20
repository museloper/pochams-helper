"use client";

import { useMemo, useState } from "react";
import type {
  Ability,
  LocalizedName,
  Move,
  Pokemon,
  PokemonType,
  StatKey,
} from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/types";
import {
  DEFENSE_BASED_MOVES,
  EV_MAX,
  MULTI_HIT_POWERS,
  WEIGHT_BASED_MOVES,
  cumulativePower,
  damageRolls,
  hpValue,
  koVerdict,
  statValue,
  weightBasedPower,
  withStage,
  type StatNature,
} from "@/lib/damage";
import { effectiveness } from "@/lib/typeChart";
import {
  ATTACKER_ITEMS,
  DEFENDER_ITEMS,
  STATUS_OPTIONS,
  WEATHER_OPTIONS,
  abilityMods,
  combineMods,
  itemIconUrl,
  itemMods,
  statusMods,
  weatherDefenseMult,
  weatherPowerMult,
  type ItemOption,
  type ModContext,
  type Status,
  type Weather,
} from "@/lib/battleModifiers";
import { moves as moveDict } from "@/lib/data/moves";
import { asset } from "@/lib/basePath";
import { useLanguage } from "@/stores/useLanguage";
import { useT, type TranslationKey } from "@/lib/i18n";
import { TypeBadge } from "@/components/TypeBadge";

type Unit = {
  key: string;
  slug: string;
  names: LocalizedName;
  sprite: string;
  types: PokemonType[];
  base: Record<StatKey, number>;
  weight: number;
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

const NATURES: { value: StatNature; key: TranslationKey }[] = [
  { value: "plus", key: "nature.plus" },
  { value: "neutral", key: "nature.neutral" },
  { value: "minus", key: "nature.minus" },
];

// A mega Pokémon must hold its Mega Stone, so its item is fixed.
const MEGA_STONE_ITEMS: ItemOption[] = [
  { id: "mega-stone", ko: "메가스톤", en: "Mega Stone", ja: "メガストーン" },
];

// Shared row-label sizing so every control row (EV sliders, toggles, selects)
// in the attacker/defender panels lines up at the same x-offset; `truncate`
// guards against long translated labels ever overlapping the control itself.
const ROW_LABEL =
  "w-24 shrink-0 truncate text-xs text-gray-500 dark:text-gray-400";
// Shared row height so every control row has the same vertical footprint
// regardless of its control type (slider vs. button group vs. dropdown).
const ROW = "flex min-h-9 items-center justify-between gap-2";
const ROW_START = "flex min-h-9 items-center gap-2";

const WEATHER_LABEL_KEY: Record<Weather, TranslationKey> = {
  none: "weather.none",
  sun: "weather.sun",
  rain: "weather.rain",
  sand: "weather.sand",
  snow: "weather.snow",
};

// Weather Ball changes type (and doubles power) with the active weather.
const WEATHER_BALL_TYPE: Record<Weather, PokemonType> = {
  none: "normal",
  sun: "fire",
  rain: "water",
  sand: "rock",
  snow: "ice",
};

const STATUS_LABEL_KEY: Record<Status, TranslationKey> = {
  none: "status.none",
  burn: "status.burn",
  paralysis: "status.paralysis",
  poison: "status.poison",
  toxic: "status.toxic",
  sleep: "status.sleep",
};

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
          names: form.names,
          sprite: form.sprite,
          types: form.types,
          base: form.baseStats,
          weight: form.weight,
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
  const lang = useLanguage((s) => s.lang);
  const [query, setQuery] = useState("");
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
          <span className="text-lg font-semibold">{selected.names[lang]}</span>
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={selected ? selected.names[lang] : placeholder}
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
                <span className="flex-1">{u.names[lang]}</span>
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
  const t = useT();
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
          {t(n.key)}
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
    <div className={ROW_START}>
      <span className={ROW_LABEL}>{label}</span>
      <input
        type="range"
        min={0}
        max={EV_MAX}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-rose-500"
      />
      <input
        type="number"
        min={0}
        max={EV_MAX}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(Math.max(0, Math.min(EV_MAX, n)));
        }}
        className="w-8 shrink-0 [appearance:textfield] rounded border border-gray-300 bg-transparent px-1 py-0.5 text-right text-xs tabular-nums outline-none focus:border-gray-500 dark:border-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        /{EV_MAX}
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
  const lang = useLanguage((s) => s.lang);
  const t = useT();
  return (
    <div className={ROW}>
      <span className={ROW_LABEL}>{t("common.ability")}</span>
      {/* No wrap + compact font so 3 abilities stay on one line. */}
      <div className="inline-flex min-w-0 justify-end gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
        {abilities.map((a, i) => (
          <button
            key={a.en}
            type="button"
            onClick={() => onChange(i)}
            className={
              idx === i
                ? "rounded-md bg-gray-900 px-1.5 py-1 text-[11px] font-medium whitespace-nowrap text-white dark:bg-white dark:text-gray-900"
                : "rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }
          >
            {a[lang]}
            {a.hidden && t("common.abilityHidden")}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Attacker's major status condition (Guts + Burn interaction, issue #12). */
function StatusSelect({
  value,
  onChange,
}: {
  value: Status;
  onChange: (v: Status) => void;
}) {
  const t = useT();
  // Unlike the other rows this one spans full width (no right-aligned offset)
  // so all options fit on a single line as an even segmented control.
  return (
    <div className={ROW_START}>
      <span className={ROW_LABEL}>{t("damage.status")}</span>
      <div className="flex flex-1 gap-0.5 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            title={s.ko}
            className={
              value === s.value
                ? "flex-1 rounded-md bg-gray-900 px-1 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                : "flex-1 rounded-md px-1 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }
          >
            {t(STATUS_LABEL_KEY[s.value])}
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
  const t = useT();
  const lang = useLanguage((s) => s.lang);
  const [open, setOpen] = useState(false);
  const selected = items.find((it) => it.id === value) ?? items[0];
  return (
    <div className={ROW}>
      <span className={ROW_LABEL}>{t("common.item")}</span>
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1 text-left text-xs dark:border-gray-600 dark:bg-gray-900"
        >
          <ItemIcon icon={selected.icon} />
          <span className="min-w-0 flex-1 truncate">{selected[lang]}</span>
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
                  <span className="whitespace-nowrap">{it[lang]}</span>
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
  const t = useT();
  return (
    <div className={ROW}>
      <span className={ROW_LABEL}>{t("common.rankOf", { stat: label })}</span>
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
  const lang = useLanguage((s) => s.lang);
  const t = useT();

  // Shared field condition (issue #11), not attacker/defender-specific.
  const [weather, setWeather] = useState<Weather>("none");

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
  // Landed-hit count for accumulating multi-hit moves (e.g. Triple Axel, #5).
  const [hitCount, setHitCount] = useState(1);
  // Attacker's major status condition (Guts + Burn interaction, issue #12).
  const [atkStatus, setAtkStatus] = useState<Status>("none");

  const [defenderKey, setDefenderKey] = useState<string | null>(null);
  const [defNature, setDefNature] = useState<StatNature>("neutral");
  const [hpEv, setHpEv] = useState(0);
  const [defEv, setDefEv] = useState(0);
  const [defItem, setDefItem] = useState("");
  const [defAbilityIdx, setDefAbilityIdx] = useState(0);
  const [defStage, setDefStage] = useState(0);
  const [hpPct, setHpPct] = useState(100);

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
            m.en.toLowerCase().includes(q) ||
            m.ja.includes(q)),
      )
    : [];

  const physical = move?.category === "physical";
  // Body Press (physical) attacks with the user's Defense stat (issue #9).
  const usesDefense = !!(move && DEFENSE_BASED_MOVES.has(move.slug));
  const atkLabel = t(
    usesDefense ? "stat.defense" : physical ? "stat.attack" : "stat.spAttack",
  );
  const defLabel = t(physical ? "stat.defense" : "stat.spDefense");

  const atkAbility = attacker?.abilities[atkAbilityIdx] ?? null;
  // Mega Sol (Mega Meganium): "can use its moves as if the weather were harsh
  // sunlight" regardless of the actual field weather — an attacker-only
  // override of the offensive Fire/Water power boost (and Weather Ball).
  const hasMegaSol = !!(
    atkAbility && abilitySlug(atkAbility.en) === "mega-sol"
  );
  const attackerWeather: Weather = hasMegaSol ? "sun" : weather;

  // Weather Ball: its type follows the weather (the attacker's effective one,
  // e.g. always "sun" under Mega Sol), and its power doubles (50→100) whenever
  // any weather is active. STAB/effectiveness use this effective type.
  const isWeatherBall = move?.slug === "weather-ball";
  const effectiveMoveType: PokemonType | null = move
    ? isWeatherBall
      ? WEATHER_BALL_TYPE[attackerWeather]
      : move.type
    : null;

  // Accumulating multi-hit moves: total power depends on how many hits land.
  const perHitPowers = move ? MULTI_HIT_POWERS[move.slug] : undefined;
  const isMultiHit = !!perHitPowers;
  // Weight-based moves (Grass Knot / Low Kick): power from the target's weight.
  const isWeightBased = !!(move && WEIGHT_BASED_MOVES.has(move.slug));
  const effectivePower = perHitPowers
    ? cumulativePower(perHitPowers, hitCount)
    : isWeightBased && defender
      ? weightBasedPower(defender.weight)
      : isWeatherBall
        ? attackerWeather !== "none"
          ? 100
          : 50
        : (move?.power ?? 0);

  // Effective stats. Body Press uses the user's Defense as the offensive stat.
  const attack = move
    ? statValue(
        usesDefense
          ? attacker!.base.def
          : physical
            ? attacker!.base.atk
            : attacker!.base.spa,
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

  const defAbility = defender?.abilities[defAbilityIdx] ?? null;
  const hasGuts = !!(atkAbility && abilitySlug(atkAbility.en) === "guts");

  const stab = !!(
    move &&
    attacker &&
    effectiveMoveType &&
    attacker.types.includes(effectiveMoveType)
  );
  const baseTypeEff =
    move && defender && effectiveMoveType
      ? effectiveness(effectiveMoveType, defender.types)
      : 1;

  // Combine held-item and ability modifiers.
  const mods =
    move && defender
      ? combineMods([
          itemMods(atkItem, {
            category: move.category,
            moveType: effectiveMoveType ?? move.type,
            power: move.power ?? 0,
            typeEff: baseTypeEff,
          } satisfies ModContext),
          itemMods(defItem, {
            category: move.category,
            moveType: effectiveMoveType ?? move.type,
            power: move.power ?? 0,
            typeEff: baseTypeEff,
          } satisfies ModContext),
          abilityMods(
            atkAbility ? abilitySlug(atkAbility.en) : "",
            "attacker",
            {
              category: move.category,
              moveType: effectiveMoveType ?? move.type,
              power: move.power ?? 0,
              typeEff: baseTypeEff,
            },
          ),
          abilityMods(
            defAbility ? abilitySlug(defAbility.en) : "",
            "defender",
            {
              category: move.category,
              moveType: effectiveMoveType ?? move.type,
              power: move.power ?? 0,
              typeEff: baseTypeEff,
            },
          ),
          // Power boost uses the attacker's effective weather (Mega Sol
          // overrides to "sun"); the defensive Sand/Snow stat boost always
          // follows the real field weather.
          {
            powerMult: weatherPowerMult(
              attackerWeather,
              effectiveMoveType ?? move.type,
            ),
          },
          {
            defMult: weatherDefenseMult(weather, move.category, defender.types),
          },
          statusMods(atkStatus, {
            category: move.category,
            hasGuts,
            usesDefense,
          }),
        ])
      : null;

  const typeEff = mods?.immune ? 0 : baseTypeEff;
  const stabMult = stab ? (mods?.stabMult ?? 1.5) : 1;

  const canCompute = !!(move && defender && effectivePower > 0);
  const rolls =
    canCompute && mods
      ? damageRolls({
          power: effectivePower,
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
  const verdictLabel = verdict
    ? verdict.kind === "immune"
      ? t("verdict.immune")
      : verdict.kind === "ohko"
        ? t("verdict.ohko")
        : verdict.kind === "ohko-chance"
          ? t("verdict.ohkoChance")
          : t("verdict.nhko", { n: verdict.hits ?? 2 })
    : null;

  // Survival check against an adjustable current HP (issue #1): does a single
  // hit (e.g. a priority move) leave the defender standing at this HP%?
  const currentHp = Math.max(1, Math.floor((hp * hpPct) / 100));
  const survival: {
    label: string;
    tone: "ko" | "survive" | "random";
    chance?: number;
  } | null =
    rolls.length && canCompute
      ? min >= currentHp
        ? { label: t("damage.survivalKo"), tone: "ko" }
        : max < currentHp
          ? { label: t("damage.survivalSurvive"), tone: "survive" }
          : {
              label: t("verdict.ohkoChance"),
              tone: "random",
              chance: rolls.filter((d) => d >= currentHp).length / rolls.length,
            }
      : null;
  // Minimum HP needed to survive the max roll, as a % of full HP.
  const survivePct =
    hp > 0 ? Math.min(100, Math.ceil(((max + 1) / hp) * 100)) : 0;
  const survivableAtFull = max < hp;

  return (
    <div>
      {/* Weather: shared field condition, affects both sides (issue #11). */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("damage.weather")}
        </span>
        <div className="inline-flex flex-wrap rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {WEATHER_OPTIONS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWeather(w.value)}
              title={w.ko}
              className={
                weather === w.value
                  ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                  : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }
            >
              {t(WEATHER_LABEL_KEY[w.value])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Attacker */}
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="mb-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {t("damage.attacker")}
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
            placeholder={t("damage.searchAttacker")}
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
                      {t("common.all")}
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
                    placeholder={t("damage.searchMove")}
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
                            setHitCount(MULTI_HIT_POWERS[m.slug]?.length ?? 1);
                          }}
                          className={
                            moveSlug === m.slug
                              ? "flex w-full items-center gap-2 bg-rose-50 px-3 py-1.5 text-left text-sm dark:bg-rose-900/30"
                              : "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                        >
                          <TypeBadge type={m.type} />
                          <span className="min-w-0 flex-1 truncate">
                            {m[lang]}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {t(
                              m.category === "physical"
                                ? "common.physical"
                                : "common.special",
                            )}{" "}
                            · {m.power ?? "—"}
                          </span>
                        </button>
                      </li>
                    ))}
                    {filteredMoves.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-gray-400">
                        {t("damage.noMoves")}
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
                    className="flex min-h-9 w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:border-gray-400 dark:border-gray-600"
                  >
                    <TypeBadge type={effectiveMoveType ?? move.type} />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {move[lang]}
                    </span>
                    {stab && (
                      <span className="shrink-0 text-xs text-rose-500">
                        {t("damage.stab")}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400">
                      {t(physical ? "common.physical" : "common.special")} ·{" "}
                      {move.power ?? "—"}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {t("damage.change")}
                    </span>
                  </button>
                )
              )}

              {move && (
                <>
                  <EvSlider
                    label={t("common.evOf", { stat: atkLabel })}
                    value={atkEv}
                    onChange={setAtkEv}
                  />
                  {/* The defender panel has two EV rows (HP + Def); this spacer
                      keeps the following rows (nature/stage/ability/item)
                      vertically aligned across both panels. */}
                  <div className="min-h-9" aria-hidden />
                  <div className={ROW}>
                    <span className={ROW_LABEL}>
                      {t("common.natureOf", { stat: atkLabel })}
                    </span>
                    <NatureToggle value={atkNature} onChange={setAtkNature} />
                  </div>
                  <StageSelect
                    label={atkLabel}
                    value={atkStage}
                    onChange={setAtkStage}
                  />
                  {isMultiHit && perHitPowers && (
                    <div className={ROW}>
                      <span className={ROW_LABEL}>{t("damage.hitCount")}</span>
                      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                        {perHitPowers.map((_, i) => {
                          const n = i + 1;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setHitCount(n)}
                              className={
                                hitCount === n
                                  ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                                  : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                              }
                            >
                              {t("common.hitsN", { n })}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
              <StatusSelect value={atkStatus} onChange={setAtkStatus} />
            </div>
          )}
        </section>

        {/* Defender */}
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="mb-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
            {t("damage.defender")}
          </h2>
          <PokemonSearch
            units={units}
            selectedKey={defenderKey}
            onSelect={(k) => {
              setDefenderKey(k);
              setDefAbilityIdx(0);
              setHpPct(100);
              setDefItem(
                units.find((u) => u.key === k)?.isMega ? "mega-stone" : "",
              );
            }}
            placeholder={t("damage.searchDefender")}
          />

          {defender && (
            <div className="mt-3 space-y-3">
              {/* min-h-9 matches the attacker's move-summary row so the two
                  panels' subsequent rows line up (issue: panel row alignment). */}
              <div className="flex min-h-9 flex-wrap items-center gap-1">
                {defender.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>
              <EvSlider
                label={t("common.evOf", { stat: t("stat.hp") })}
                value={hpEv}
                onChange={setHpEv}
              />
              <EvSlider
                label={t("common.evOf", {
                  stat: move ? defLabel : t("stat.defBoth"),
                })}
                value={defEv}
                onChange={setDefEv}
              />
              <div className={ROW}>
                <span className={ROW_LABEL}>
                  {t("common.natureOf", {
                    stat: move ? defLabel : t("stat.bulk"),
                  })}
                </span>
                <NatureToggle value={defNature} onChange={setDefNature} />
              </div>
              <StageSelect
                label={move ? defLabel : t("stat.defense")}
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

      {/* Legend for the `*` hidden-ability marker (shown once). */}
      {(attacker?.abilities.some((a) => a.hidden) ||
        defender?.abilities.some((a) => a.hidden)) && (
        <p className="mt-2 text-xs text-gray-400">
          {t("common.abilityHiddenNote")}
        </p>
      )}

      {/* Result */}
      {attacker && move && defender && (
        <div className="mt-6 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          {canCompute ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("damage.dmgVsHp")}
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {((min / hp) * 100).toFixed(1)}% ~{" "}
                    {((max / hp) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {t("damage.dmgDetail", { min, max, hp })}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={
                      verdict?.kind === "ohko"
                        ? "text-2xl font-bold text-rose-600 dark:text-rose-400"
                        : "text-2xl font-bold"
                    }
                  >
                    {verdictLabel}
                    {verdict?.chance !== undefined && (
                      <span className="ml-1 text-base">
                        {(verdict.chance * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t("damage.typeEff", { mult: typeEff })}
                    {stab && ` · ${t("damage.stab")}`}
                    {isMultiHit &&
                      ` · ${t("damage.multiHitInfo", {
                        hits: hitCount,
                        power: effectivePower,
                      })}`}
                    {isWeightBased &&
                      defender &&
                      ` · ${t("damage.weightInfo", {
                        weight: defender.weight,
                        power: effectivePower,
                      })}`}
                    {isWeatherBall &&
                      ` · ${t("damage.weatherBallInfo", {
                        power: effectivePower,
                      })}`}
                    {weather !== "none" &&
                      ` · ${t("damage.weather")}: ${t(WEATHER_LABEL_KEY[weather])}`}
                    {hasMegaSol && ` · ${t("damage.megaSolInfo")}`}
                    {physical &&
                      !usesDefense &&
                      atkStatus !== "none" &&
                      hasGuts &&
                      ` · ${t("damage.gutsInfo")}`}
                    {physical &&
                      !usesDefense &&
                      atkStatus === "burn" &&
                      !hasGuts &&
                      ` · ${t("damage.burnInfo")}`}
                    {mods &&
                      mods.powerMult !== 1 &&
                      ` · ${t("damage.powerMod", {
                        from: effectivePower,
                        to: Math.floor(effectivePower * mods.powerMult),
                      })}`}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3 dark:border-gray-800">
                <div>
                  <div className="text-xs text-gray-400">
                    {t("common.statValueOf", { stat: atkLabel })}
                  </div>
                  <div className="font-semibold tabular-nums">{attack}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">
                    {t("damage.hpStat")}
                  </div>
                  <div className="font-semibold tabular-nums">{hp}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">
                    {t("common.statValueOf", { stat: defLabel })}
                  </div>
                  <div className="font-semibold tabular-nums">
                    {defenseStat}
                  </div>
                </div>
              </div>

              {/* HP adjustment: survive a single hit (e.g. priority move)? */}
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className={ROW_START}>
                  <span className={ROW_LABEL}>{t("damage.remainingHp")}</span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={hpPct}
                    onChange={(e) => setHpPct(Number(e.target.value))}
                    className="min-w-0 flex-1 accent-sky-500"
                  />
                  <span className="w-24 shrink-0 text-right text-xs text-gray-500 tabular-nums dark:text-gray-400">
                    {hpPct}% · {currentHp}
                  </span>
                </div>
                {survival && (
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div
                      className={
                        survival.tone === "survive"
                          ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                          : survival.tone === "ko"
                            ? "text-sm font-semibold text-rose-600 dark:text-rose-400"
                            : "text-sm font-semibold text-amber-600 dark:text-amber-400"
                      }
                    >
                      {survival.label}
                      {survival.chance !== undefined && (
                        <span className="ml-1 text-xs">
                          (
                          {t("damage.faintChance", {
                            pct: (survival.chance * 100).toFixed(1),
                          })}
                          )
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {survivableAtFull
                        ? t("damage.surviveThreshold", {
                            hp: max + 1,
                            pct: survivePct,
                          })
                        : t("damage.noSurvive")}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">{t("damage.variablePower")}</p>
          )}
        </div>
      )}

      {!(attacker && move && defender) && (
        <p className="mt-6 text-sm text-gray-400">{t("damage.emptyState")}</p>
      )}
    </div>
  );
}
