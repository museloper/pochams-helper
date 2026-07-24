import type { LocalizedName } from "@/lib/types";

/**
 * Localized names for all 25 natures, keyed by English name (as returned by
 * championsbattledata's usage API). Static/immutable, so hardcoded as a code
 * constant rather than fetched at runtime (see docs/DECISIONS.md). Sourced
 * from PokéAPI /nature/{id}.
 */
export const NATURE_NAMES: Record<string, LocalizedName> = {
  Adamant: { ko: "고집", en: "Adamant", ja: "いじっぱり" },
  Bashful: { ko: "수줍음", en: "Bashful", ja: "てれや" },
  Bold: { ko: "대담", en: "Bold", ja: "ずぶとい" },
  Brave: { ko: "용감", en: "Brave", ja: "ゆうかん" },
  Calm: { ko: "차분", en: "Calm", ja: "おだやか" },
  Careful: { ko: "신중", en: "Careful", ja: "しんちょう" },
  Docile: { ko: "온순", en: "Docile", ja: "すなお" },
  Gentle: { ko: "얌전", en: "Gentle", ja: "おとなしい" },
  Hardy: { ko: "노력", en: "Hardy", ja: "がんばりや" },
  Hasty: { ko: "성급", en: "Hasty", ja: "せっかち" },
  Impish: { ko: "장난꾸러기", en: "Impish", ja: "わんぱく" },
  Jolly: { ko: "명랑", en: "Jolly", ja: "ようき" },
  Lax: { ko: "촐랑", en: "Lax", ja: "のうてんき" },
  Lonely: { ko: "외로움", en: "Lonely", ja: "さみしがり" },
  Mild: { ko: "의젓", en: "Mild", ja: "おっとり" },
  Modest: { ko: "조심", en: "Modest", ja: "ひかえめ" },
  Naive: { ko: "천진난만", en: "Naive", ja: "むじゃき" },
  Naughty: { ko: "개구쟁이", en: "Naughty", ja: "やんちゃ" },
  Quiet: { ko: "냉정", en: "Quiet", ja: "れいせい" },
  Quirky: { ko: "변덕", en: "Quirky", ja: "きまぐれ" },
  Rash: { ko: "덜렁", en: "Rash", ja: "うっかりや" },
  Relaxed: { ko: "무사태평", en: "Relaxed", ja: "のんき" },
  Sassy: { ko: "건방", en: "Sassy", ja: "なまいき" },
  Serious: { ko: "성실", en: "Serious", ja: "まじめ" },
  Timid: { ko: "겁쟁이", en: "Timid", ja: "おくびょう" },
};
