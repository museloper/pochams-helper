/**
 * Core domain types for Pokémon Champions data.
 *
 * These are the normalized shapes our snapshot data is mapped into
 * (see docs/DECISIONS.md — "데이터 소스: 스냅샷 JSON 소유"). Source APIs
 * (PokéAPI, championsbattledata) use different field names and encodings;
 * the ingest step normalizes them into the types below so the rest of the
 * app never depends on a source's raw format.
 */

// ---------------------------------------------------------------------------
// Types (the 18 elemental types)
// ---------------------------------------------------------------------------

/** The 18 elemental types. Champions uses the mainline type system unchanged. */
export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/**
 * All 18 types in canonical order. Handy for building/iterating the type chart
 * and rendering type pickers. Kept `as const` so it doubles as the source of
 * truth for {@link PokemonType}.
 */
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const satisfies readonly PokemonType[];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** Stat keys in the conventional order (HP, Atk, Def, SpA, SpD, Spe). */
export const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/**
 * A full set of the six battle stats. Reused for base stats, IVs, EVs, and
 * computed in-battle stats.
 */
export type StatSpread = Record<StatKey, number>;

/**
 * Mainline base stats of a specific form (e.g. Garchomp hp 108). Recovered
 * during ingest by inverting the source's Lv50/31IV/0EV/neutral values; see
 * scripts/ingest-pokemon.mjs and docs/DECISIONS.md.
 */
export type BaseStats = StatSpread;

// ---------------------------------------------------------------------------
// Type effectiveness
// ---------------------------------------------------------------------------

/**
 * Multiplier from a single attacking type against a single defending type —
 * i.e. one cell of the type chart. Never 0.25 or 4; those only arise from the
 * product over a dual-type defender (see {@link DamageMultiplier}).
 */
export type TypeChartValue = 0 | 0.5 | 1 | 2;

/**
 * Combined effectiveness against a defender's full typing: the product of the
 * chart values over each of the defender's types.
 */
export type DamageMultiplier = 0 | 0.25 | 0.5 | 1 | 2 | 4;

/** Full type chart: `TYPE_CHART[attacker][defender]` = single-type multiplier. */
export type TypeChart = Record<
  PokemonType,
  Record<PokemonType, TypeChartValue>
>;

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

export type MoveCategory = "physical" | "special" | "status";

export interface Move {
  /** URL/lookup slug, e.g. "dragon-claw". */
  slug: string;
  /** Korean display name, e.g. "드래곤클로". */
  ko: string;
  /** English display name, e.g. "Dragon Claw". */
  en: string;
  /** Japanese display name, e.g. "ドラゴンクロー". */
  ja: string;
  type: PokemonType;
  category: MoveCategory;
  /** Base power; `null` for status moves. */
  power: number | null;
  /** Accuracy in percent, or `null` for moves that bypass the accuracy check. */
  accuracy: number | null;
  /** Move priority; > 0 means it moves before normal-priority moves. */
  priority: number;
}

// ---------------------------------------------------------------------------
// Pokémon
// ---------------------------------------------------------------------------

/** Kind of form. Kept as a small union but open to more variants later. */
export type FormKind = "base" | "mega" | "regional" | "other";

/** An ability with localized names and whether it is the hidden (dream) ability. */
export interface Ability {
  ko: string;
  en: string;
  ja: string;
  /** Hidden ability (드림 특성) vs. a regular ability. */
  hidden: boolean;
}

/**
 * A concrete, battle-ready form. Calculators operate on a single form, since
 * stats, types, and abilities can all differ between forms of the same species
 * (e.g. Garchomp vs. Mega Garchomp).
 */
export interface PokemonForm {
  /** Source display name of this form, e.g. "Garchomp" or "Mega Garchomp". */
  name: string;
  kind: FormKind;
  /** Localized names for this specific form (e.g. "메가한카리아스"). */
  names: LocalizedName;
  /** Sprite image URL for this form. Hotlinked; see docs/DECISIONS.md. */
  sprite: string;
  /** 1 or 2 types, in the game's listed order. */
  types: PokemonType[];
  baseStats: BaseStats;
  /** Possible abilities for this form (normal first, then hidden). */
  abilities: Ability[];
}

/** Supported UI languages for names. */
export type Language = "ko" | "en" | "ja";

/** A display name in each supported language. */
export type LocalizedName = Record<Language, string>;

/**
 * A species entry in the Champions roster. Groups the base form with any
 * alternate forms and the shared learnable move pool.
 */
export interface Pokemon {
  /** URL/lookup slug, e.g. "garchomp". */
  slug: string;
  /** Species display name in each supported language. */
  names: LocalizedName;
  /**
   * Sprite image URL. Hotlinked from the source (not redistributed into the
   * repo); see the asset-license note in docs/DECISIONS.md.
   */
  sprite: string;
  /** At least one form; `forms[0]` is the base form. */
  forms: PokemonForm[];
  /** Learnable move slugs, shared across forms. */
  learnableMoves: string[];
}
