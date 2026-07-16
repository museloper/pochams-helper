// Damage math for Pokémon Champions (Lv50, 31 IV assumed).
//
// Stat formulas match the speed calculator's derivation: non-HP stats are
// floor((base + 20 + EV) * nature); HP is base + 75 + EV (both at Lv50, 31 IV,
// Champions' 0–32 EV scale). Damage uses the standard formula with Gen-5-style
// rounding and the 85–100 random spread. Single-target; no weather/crit/item.

export type StatNature = "plus" | "neutral" | "minus";

export const NATURE_MOD: Record<StatNature, number> = {
  plus: 1.1,
  neutral: 1,
  minus: 0.9,
};

export const EV_MAX = 32;

/** A non-HP stat (Atk/Def/SpA/SpD) at Lv50. */
export function statValue(
  base: number,
  ev: number,
  nature: StatNature,
): number {
  return Math.floor((base + 20 + ev) * NATURE_MOD[nature]);
}

/** HP stat at Lv50 (nature never affects HP). */
export function hpValue(baseHp: number, ev: number): number {
  return baseHp + 75 + ev;
}

/** Apply a stat stage (rank, -6..+6) to a stat. +n = (2+n)/2, -n = 2/(2+n). */
export function withStage(stat: number, stage: number): number {
  const num = stage >= 0 ? 2 + stage : 2;
  const den = stage >= 0 ? 2 : 2 - stage;
  return Math.floor((stat * num) / den);
}

// Moves whose base power differs per hit and accumulates across a fixed number
// of hits (issue #4/#5). Stored as each hit's base power; the calculator models
// the landed-hits total as one effective power via `cumulativePower`.
export const MULTI_HIT_POWERS: Record<string, number[]> = {
  "triple-axel": [20, 40, 60],
};

/** Total base power after `hits` landed hits (hits clamped to 0..perHit.length). */
export function cumulativePower(perHit: number[], hits: number): number {
  const n = Math.max(0, Math.min(perHit.length, hits));
  return perHit.slice(0, n).reduce((sum, p) => sum + p, 0);
}

export interface DamageInput {
  power: number;
  /** Attacker's effective Atk (physical) or SpA (special), after item/ability. */
  attack: number;
  /** Defender's effective Def (physical) or SpD (special), after item/ability. */
  defense: number;
  /** STAB multiplier: 1 (none), 1.5, or 2 (Adaptability). */
  stabMult: number;
  /** Type effectiveness against the defender: 0, 0.25, 0.5, 1, 2, or 4. */
  typeEff: number;
  /** Power multiplier from items/abilities (type items, Technician, …). */
  powerMult?: number;
  /** Final-stage multiplier (Life Orb, Expert Belt, Multiscale, Filter, …). */
  finalMult?: number;
}

/** The 16 possible damage values (random rolls 85–100), ascending. */
export function damageRolls({
  power,
  attack,
  defense,
  stabMult,
  typeEff,
  powerMult = 1,
  finalMult = 1,
}: DamageInput): number[] {
  if (typeEff === 0 || power <= 0) return new Array(16).fill(0);
  const effPower = Math.max(1, Math.floor(power * powerMult));
  const base =
    Math.floor(
      Math.floor(((2 * 50) / 5 + 2) * effPower * (attack / defense)) / 50,
    ) + 2;
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    let d = Math.floor((base * r) / 100);
    d = Math.floor(d * stabMult);
    d = Math.floor(d * typeEff);
    d = Math.floor(d * finalMult);
    rolls.push(Math.max(1, d));
  }
  return rolls;
}

/** Language-agnostic KO classification; the UI formats the label (issue #8). */
export type KoKind = "immune" | "ohko" | "ohko-chance" | "nhko";

export interface KoResult {
  kind: KoKind;
  /** Number of hits to KO (for `nhko`). */
  hits?: number;
  /** OHKO probability (0–1) for `ohko-chance`. */
  chance?: number;
}

/** Classify how many hits KO the defender (min/max roll based). */
export function koVerdict(rolls: number[], hp: number): KoResult {
  const min = Math.min(...rolls);
  const max = Math.max(...rolls);
  if (max === 0) return { kind: "immune" };
  if (min >= hp) return { kind: "ohko" };
  if (max >= hp) {
    const koRolls = rolls.filter((d) => d >= hp).length;
    return { kind: "ohko-chance", chance: koRolls / rolls.length };
  }
  // Guaranteed n-hit KO: smallest n where n × min roll reaches HP.
  let hits = 2;
  while (hits * min < hp) hits++;
  return { kind: "nhko", hits };
}
