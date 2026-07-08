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
 * Base stats of a specific form.
 *
 * NOTE: championsbattledata reports in-game *displayed* stats (e.g. Garchomp
 * hp 183), which are NOT the mainline base-stat values (hp 108). Which
 * convention we store here is still open — see the "챔피언스 종족값 의미 확정"
 * item in docs/DECISIONS.md. The type shape is unaffected either way.
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
  /** Display name, English, e.g. "Dragon Claw". */
  name: string;
  type: PokemonType;
  category: MoveCategory;
  /** Base power; `null` for status moves. */
  power: number | null;
  /** Accuracy in percent, or `null` for moves that bypass the accuracy check. */
  accuracy: number | null;
}

// ---------------------------------------------------------------------------
// Pokémon
// ---------------------------------------------------------------------------

/** Kind of form. Kept as a small union but open to more variants later. */
export type FormKind = "base" | "mega" | "regional" | "other";

/**
 * A concrete, battle-ready form. Calculators operate on a single form, since
 * stats, types, and abilities can all differ between forms of the same species
 * (e.g. Garchomp vs. Mega Garchomp).
 */
export interface PokemonForm {
  /** Display name of this form, e.g. "Garchomp" or "Mega Garchomp". */
  name: string;
  kind: FormKind;
  /** 1 or 2 types, in the game's listed order. */
  types: PokemonType[];
  baseStats: BaseStats;
  /** Possible abilities for this form (names only for now). */
  abilities: string[];
}

/**
 * A species entry in the Champions roster. Groups the base form with any
 * alternate forms and the shared learnable move pool.
 */
export interface Pokemon {
  /** URL/lookup slug, e.g. "garchomp". */
  slug: string;
  /** Species display name (base form), English. Korean labels map separately. */
  name: string;
  /** At least one form; `forms[0]` is the base form. */
  forms: PokemonForm[];
  /** Learnable move slugs, shared across forms. */
  learnableMoves: string[];
}
