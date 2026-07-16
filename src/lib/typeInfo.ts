import type { LocalizedName, PokemonType } from "@/lib/types";

/**
 * Display metadata for each type: localized labels (한/영/일) and the type's
 * signature color. Badges fill `bg` with white text (standard type-tag look).
 */
export const TYPE_INFO: Record<PokemonType, LocalizedName & { bg: string }> = {
  normal: { ko: "노말", en: "Normal", ja: "ノーマル", bg: "#A8A77A" },
  fire: { ko: "불꽃", en: "Fire", ja: "ほのお", bg: "#EE8130" },
  water: { ko: "물", en: "Water", ja: "みず", bg: "#6390F0" },
  electric: { ko: "전기", en: "Electric", ja: "でんき", bg: "#F7D02C" },
  grass: { ko: "풀", en: "Grass", ja: "くさ", bg: "#7AC74C" },
  ice: { ko: "얼음", en: "Ice", ja: "こおり", bg: "#96D9D6" },
  fighting: { ko: "격투", en: "Fighting", ja: "かくとう", bg: "#C22E28" },
  poison: { ko: "독", en: "Poison", ja: "どく", bg: "#A33EA1" },
  ground: { ko: "땅", en: "Ground", ja: "じめん", bg: "#E2BF65" },
  flying: { ko: "비행", en: "Flying", ja: "ひこう", bg: "#A98FF3" },
  psychic: { ko: "에스퍼", en: "Psychic", ja: "エスパー", bg: "#F95587" },
  bug: { ko: "벌레", en: "Bug", ja: "むし", bg: "#A6B91A" },
  rock: { ko: "바위", en: "Rock", ja: "いわ", bg: "#B6A136" },
  ghost: { ko: "고스트", en: "Ghost", ja: "ゴースト", bg: "#735797" },
  dragon: { ko: "드래곤", en: "Dragon", ja: "ドラゴン", bg: "#6F35FC" },
  dark: { ko: "악", en: "Dark", ja: "あく", bg: "#705746" },
  steel: { ko: "강철", en: "Steel", ja: "はがね", bg: "#B7B7CE" },
  fairy: { ko: "페어리", en: "Fairy", ja: "フェアリー", bg: "#D685AD" },
};
