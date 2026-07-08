import type { PokemonType } from "@/lib/types";
import { TYPE_INFO } from "@/lib/typeInfo";

/** A small colored badge showing a single Pokémon type (Korean label). */
export function TypeBadge({ type }: { type: PokemonType }) {
  const info = TYPE_INFO[type];
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: info.bg, color: info.fg }}
    >
      {info.ko}
    </span>
  );
}
