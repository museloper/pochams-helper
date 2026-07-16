"use client";

import type { PokemonType } from "@/lib/types";
import { TYPE_INFO } from "@/lib/typeInfo";
import { useLanguage } from "@/stores/useLanguage";

/** A small colored badge showing a single Pokémon type (localized label). */
export function TypeBadge({ type }: { type: PokemonType }) {
  const lang = useLanguage((s) => s.lang);
  const info = TYPE_INFO[type];
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: info.bg, color: "#ffffff" }}
    >
      {info[lang]}
    </span>
  );
}
