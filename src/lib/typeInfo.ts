import type { PokemonType } from "@/lib/types";

/**
 * Display metadata for each type: Korean label (UI copy is Korean per project
 * convention) and badge colors. `fg` is chosen for readable contrast on `bg`.
 */
export const TYPE_INFO: Record<
  PokemonType,
  { ko: string; bg: string; fg: string }
> = {
  normal: { ko: "노말", bg: "#A8A77A", fg: "#1f2937" },
  fire: { ko: "불꽃", bg: "#EE8130", fg: "#ffffff" },
  water: { ko: "물", bg: "#6390F0", fg: "#ffffff" },
  electric: { ko: "전기", bg: "#F7D02C", fg: "#1f2937" },
  grass: { ko: "풀", bg: "#7AC74C", fg: "#1f2937" },
  ice: { ko: "얼음", bg: "#96D9D6", fg: "#1f2937" },
  fighting: { ko: "격투", bg: "#C22E28", fg: "#ffffff" },
  poison: { ko: "독", bg: "#A33EA1", fg: "#ffffff" },
  ground: { ko: "땅", bg: "#E2BF65", fg: "#1f2937" },
  flying: { ko: "비행", bg: "#A98FF3", fg: "#1f2937" },
  psychic: { ko: "에스퍼", bg: "#F95587", fg: "#ffffff" },
  bug: { ko: "벌레", bg: "#A6B91A", fg: "#1f2937" },
  rock: { ko: "바위", bg: "#B6A136", fg: "#1f2937" },
  ghost: { ko: "고스트", bg: "#735797", fg: "#ffffff" },
  dragon: { ko: "드래곤", bg: "#6F35FC", fg: "#ffffff" },
  dark: { ko: "악", bg: "#705746", fg: "#ffffff" },
  steel: { ko: "강철", bg: "#B7B7CE", fg: "#1f2937" },
  fairy: { ko: "페어리", bg: "#D685AD", fg: "#1f2937" },
};
