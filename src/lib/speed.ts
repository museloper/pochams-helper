// Speed math for Pokémon Champions (Lv50, 31 IV assumed).
//
// Champions uses a 0–32 effort-value (EV) scale. Working from championsbattledata's
// reported neutral/0-EV Lv50 stat (= base + 20 for non-HP) and the fact that a
// traditional Lv50 stat gains exactly +32 pre-nature from 0→max EV, the Champions
// EV maps directly onto the pre-nature stat: pre-nature speed = base + 20 + EV.

export type SpeedNature = "plus" | "neutral" | "minus";

export const SPEED_NATURES: { value: SpeedNature; label: string }[] = [
  { value: "plus", label: "+스피드" },
  { value: "neutral", label: "무보정" },
  { value: "minus", label: "-스피드" },
];

export const NATURE_MOD: Record<SpeedNature, number> = {
  plus: 1.1,
  neutral: 1,
  minus: 0.9,
};

/** Maximum Champions EV that can be invested in a single stat. */
export const EV_MAX = 32;

/** Speed of a Pokémon at Lv50 given its base speed, EV (0–32), and nature. */
export function speedStat(
  baseSpe: number,
  ev: number,
  nature: SpeedNature,
): number {
  return Math.floor((baseSpe + 20 + ev) * NATURE_MOD[nature]);
}

/** Slowest realistic speed: 0 EV, negative nature. */
export function minSpeed(baseSpe: number): number {
  return speedStat(baseSpe, 0, "minus");
}

/** Sub-max speed (준속): max EV, neutral nature. */
export function subMaxSpeed(baseSpe: number): number {
  return speedStat(baseSpe, EV_MAX, "neutral");
}

/** Fastest speed (최속): max EV, positive nature. */
export function maxSpeed(baseSpe: number): number {
  return speedStat(baseSpe, EV_MAX, "plus");
}

/** Choice Scarf speed: neutral-nature sub-max speed × 1.5. */
export function scarfSpeed(baseSpe: number): number {
  return Math.floor(subMaxSpeed(baseSpe) * 1.5);
}
