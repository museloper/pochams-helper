// Held-item and ability damage modifiers for the damage calculator.
//
// Covers the common, high-impact competitive items and abilities. Anything not
// listed is selectable but applies no damage change. Some conditional abilities
// (pinch boosts, weather) are treated as active when selected.

import type { LocalizedName, MoveCategory, PokemonType } from "@/lib/types";

export interface ModContext {
  category: MoveCategory;
  moveType: PokemonType;
  power: number;
  /** Base type effectiveness from the chart (before ability immunities). */
  typeEff: number;
}

export interface Mods {
  /** Multiplier on the attacking stat (Choice Band/Specs, Huge Power, …). */
  atkMult: number;
  /** Multiplier on the defending stat (Assault Vest, Eviolite, Fur Coat, …). */
  defMult: number;
  /** Multiplier on move power (type items, Technician, type-boost abilities). */
  powerMult: number;
  /** Final-stage multiplier (Life Orb, Expert Belt, Multiscale, Filter, …). */
  finalMult: number;
  /** STAB override (Adaptability → 2), else null. */
  stabMult: number | null;
  /** Ability grants immunity to this move's type. */
  immune: boolean;
}

export interface ItemOption extends LocalizedName {
  id: string;
  /** PokéAPI item sprite slug; omitted for generic/none entries. */
  icon?: string;
}

/** Item sprite URL (PokéAPI sprites, hotlinked from GitHub). */
export function itemIconUrl(icon: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${icon}.png`;
}

export const ATTACKER_ITEMS: ItemOption[] = [
  { id: "", ko: "없음", en: "None", ja: "なし" },
  {
    id: "choice-band",
    ko: "구애머리띠 (물리 ×1.5)",
    en: "Choice Band (phys ×1.5)",
    ja: "こだわりハチマキ (物理 ×1.5)",
    icon: "choice-band",
  },
  {
    id: "choice-specs",
    ko: "구애안경 (특수 ×1.5)",
    en: "Choice Specs (spec ×1.5)",
    ja: "こだわりメガネ (特殊 ×1.5)",
    icon: "choice-specs",
  },
  {
    id: "life-orb",
    ko: "생명의구슬 (×1.3)",
    en: "Life Orb (×1.3)",
    ja: "いのちのたま (×1.3)",
    icon: "life-orb",
  },
  {
    id: "expert-belt",
    ko: "달인의띠 (효과굉장 ×1.2)",
    en: "Expert Belt (super-eff ×1.2)",
    ja: "たつじんのおび (効果抜群 ×1.2)",
    icon: "expert-belt",
  },
  {
    id: "muscle-band",
    ko: "힘의머리띠 (물리 ×1.1)",
    en: "Muscle Band (phys ×1.1)",
    ja: "ちからのハチマキ (物理 ×1.1)",
    icon: "muscle-band",
  },
  {
    id: "wise-glasses",
    ko: "박식안경 (특수 ×1.1)",
    en: "Wise Glasses (spec ×1.1)",
    ja: "ものしりメガネ (特殊 ×1.1)",
    icon: "wise-glasses",
  },
  {
    id: "type-item",
    ko: "타입 강화도구 (기술 타입 ×1.2)",
    en: "Type-boost item (move type ×1.2)",
    ja: "タイプ強化アイテム (技タイプ ×1.2)",
    icon: "silk-scarf",
  },
  {
    id: "light-ball",
    ko: "전기구슬 (피카츄 · 공격·특공 ×2)",
    en: "Light Ball (Pikachu · Atk/SpA ×2)",
    ja: "でんきだま (ピカチュウ · 攻撃/特攻 ×2)",
    icon: "light-ball",
  },
];

export const DEFENDER_ITEMS: ItemOption[] = [
  { id: "", ko: "없음", en: "None", ja: "なし" },
  {
    id: "assault-vest",
    ko: "돌격조끼 (특방 ×1.5)",
    en: "Assault Vest (SpD ×1.5)",
    ja: "とつげきチョッキ (特防 ×1.5)",
    icon: "assault-vest",
  },
  {
    id: "eviolite",
    ko: "진화의휘석 (방어·특방 ×1.5)",
    en: "Eviolite (Def/SpD ×1.5)",
    ja: "しんかのきせき (防御/特防 ×1.5)",
    icon: "eviolite",
  },
  {
    id: "resist-berry",
    ko: "약점 반감 열매 (효과굉장 ×0.5)",
    en: "Resist Berry (super-eff ×0.5)",
    ja: "弱点半減きのみ (効果抜群 ×0.5)",
    icon: "yache-berry",
  },
];

function empty(): Partial<Mods> {
  return {};
}

export function itemMods(id: string, ctx: ModContext): Partial<Mods> {
  const phys = ctx.category === "physical";
  const se = ctx.typeEff > 1;
  switch (id) {
    case "choice-band":
      return phys ? { atkMult: 1.5 } : empty();
    case "choice-specs":
      return !phys ? { atkMult: 1.5 } : empty();
    case "life-orb":
      return { finalMult: 1.3 };
    case "expert-belt":
      return se ? { finalMult: 1.2 } : empty();
    case "muscle-band":
      return phys ? { powerMult: 1.1 } : empty();
    case "wise-glasses":
      return !phys ? { powerMult: 1.1 } : empty();
    case "type-item":
      return { powerMult: 1.2 };
    case "light-ball":
      return { atkMult: 2 };
    case "assault-vest":
      return !phys ? { defMult: 1.5 } : empty();
    case "eviolite":
      return { defMult: 1.5 };
    case "resist-berry":
      return se ? { finalMult: 0.5 } : empty();
    default:
      return empty();
  }
}

export function abilityMods(
  slug: string,
  side: "attacker" | "defender",
  ctx: ModContext,
): Partial<Mods> {
  const { category, moveType, power, typeEff } = ctx;
  const phys = category === "physical";
  if (side === "attacker") {
    switch (slug) {
      case "adaptability":
        return { stabMult: 2 };
      case "huge-power":
      case "pure-power":
        return phys ? { atkMult: 2 } : empty();
      case "technician":
        return power <= 60 ? { powerMult: 1.5 } : empty();
      case "steelworker":
      case "steely-spirit":
        return moveType === "steel" ? { powerMult: 1.5 } : empty();
      case "transistor":
        return moveType === "electric" ? { powerMult: 1.3 } : empty();
      case "dragons-maw":
        return moveType === "dragon" ? { powerMult: 1.5 } : empty();
      case "rocky-payload":
        return moveType === "rock" ? { powerMult: 1.5 } : empty();
      case "water-bubble":
        return moveType === "water" ? { powerMult: 2 } : empty();
      case "overgrow":
        return moveType === "grass" ? { powerMult: 1.5 } : empty();
      case "blaze":
        return moveType === "fire" ? { powerMult: 1.5 } : empty();
      case "torrent":
        return moveType === "water" ? { powerMult: 1.5 } : empty();
      case "swarm":
        return moveType === "bug" ? { powerMult: 1.5 } : empty();
      default:
        return empty();
    }
  }
  switch (slug) {
    case "multiscale":
    case "shadow-shield":
      return { finalMult: 0.5 };
    case "thick-fat":
      return moveType === "fire" || moveType === "ice"
        ? { finalMult: 0.5 }
        : empty();
    case "heatproof":
    case "water-bubble":
      return moveType === "fire" ? { finalMult: 0.5 } : empty();
    case "filter":
    case "solid-rock":
    case "prism-armor":
      return typeEff > 1 ? { finalMult: 0.75 } : empty();
    case "fur-coat":
      return phys ? { defMult: 2 } : empty();
    case "ice-scales":
      return !phys ? { defMult: 2 } : empty();
    case "purifying-salt":
      return moveType === "ghost" ? { finalMult: 0.5 } : empty();
    case "levitate":
    case "earth-eater":
      return moveType === "ground" ? { immune: true } : empty();
    case "flash-fire":
    case "well-baked-body":
      return moveType === "fire" ? { immune: true } : empty();
    case "water-absorb":
    case "storm-drain":
    case "dry-skin":
      return moveType === "water" ? { immune: true } : empty();
    case "volt-absorb":
    case "lightning-rod":
    case "motor-drive":
      return moveType === "electric" ? { immune: true } : empty();
    case "sap-sipper":
      return moveType === "grass" ? { immune: true } : empty();
    default:
      return empty();
  }
}

export type Weather = "none" | "sun" | "rain" | "sand" | "snow";

export const WEATHER_OPTIONS: { value: Weather; ko: string }[] = [
  { value: "none", ko: "없음" },
  { value: "sun", ko: "쾌청 (불꽃 ×1.5 · 물 ×0.5)" },
  { value: "rain", ko: "비 (물 ×1.5 · 불꽃 ×0.5)" },
  { value: "sand", ko: "모래바람 (바위 방어 포켓몬 특방 ×1.5)" },
  { value: "snow", ko: "눈 (얼음 방어 포켓몬 방어 ×1.5)" },
];

export interface WeatherContext {
  moveType: PokemonType;
  category: MoveCategory;
  /** The defender's typing (for Sandstorm/Snow's per-type stat boosts). */
  defenderTypes: PokemonType[];
}

/** Weather field effects: Sun/Rain boost or halve move power by type; Sandstorm
 * and Snow raise Rock/Ice defenders' Sp. Def/Def respectively. */
export function weatherMods(
  weather: Weather,
  ctx: WeatherContext,
): Partial<Mods> {
  const phys = ctx.category === "physical";
  switch (weather) {
    case "sun":
      if (ctx.moveType === "fire") return { powerMult: 1.5 };
      if (ctx.moveType === "water") return { powerMult: 0.5 };
      return empty();
    case "rain":
      if (ctx.moveType === "water") return { powerMult: 1.5 };
      if (ctx.moveType === "fire") return { powerMult: 0.5 };
      return empty();
    case "sand":
      return !phys && ctx.defenderTypes.includes("rock")
        ? { defMult: 1.5 }
        : empty();
    case "snow":
      return phys && ctx.defenderTypes.includes("ice")
        ? { defMult: 1.5 }
        : empty();
    default:
      return empty();
  }
}

// Freeze is deliberately excluded: a frozen Pokémon must thaw (status cured)
// before it can act, so "attacking while frozen" never actually occurs.
export type Status =
  "none" | "burn" | "paralysis" | "poison" | "toxic" | "sleep";

export const STATUS_OPTIONS: { value: Status; ko: string }[] = [
  { value: "none", ko: "없음" },
  { value: "burn", ko: "화상 (물리 공격 ×0.5, 근성이면 무효)" },
  { value: "paralysis", ko: "마비 (근성 시 공격 ×1.5)" },
  { value: "poison", ko: "독 (근성 시 공격 ×1.5)" },
  { value: "toxic", ko: "맹독 (근성 시 공격 ×1.5)" },
  { value: "sleep", ko: "잠듦 (근성 시 공격 ×1.5)" },
];

/**
 * Attacker status-condition effects on damage (issue #12): Burn halves
 * physical Attack; Guts instead boosts physical Attack ×1.5 while having any
 * major status, and its boost overrides (bypasses) Burn's halving. Neither
 * applies to moves that substitute Defense for Attack (e.g. Body Press,
 * issue #9) since both effects specifically target the Attack stat.
 */
export function statusMods(
  status: Status,
  ctx: { category: MoveCategory; hasGuts: boolean; usesDefense: boolean },
): Partial<Mods> {
  if (status === "none" || ctx.category !== "physical" || ctx.usesDefense) {
    return empty();
  }
  if (ctx.hasGuts) return { atkMult: 1.5 };
  if (status === "burn") return { atkMult: 0.5 };
  return empty();
}

/** Combine item/ability modifiers into a single set. */
export function combineMods(parts: Partial<Mods>[]): Mods {
  const mods: Mods = {
    atkMult: 1,
    defMult: 1,
    powerMult: 1,
    finalMult: 1,
    stabMult: null,
    immune: false,
  };
  for (const p of parts) {
    if (p.atkMult) mods.atkMult *= p.atkMult;
    if (p.defMult) mods.defMult *= p.defMult;
    if (p.powerMult) mods.powerMult *= p.powerMult;
    if (p.finalMult) mods.finalMult *= p.finalMult;
    if (p.stabMult) mods.stabMult = p.stabMult;
    if (p.immune) mods.immune = true;
  }
  return mods;
}
