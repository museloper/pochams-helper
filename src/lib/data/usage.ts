import type { PokemonUsage } from "@/lib/types";
import raw from "./usage.json";

/**
 * Competitive usage snapshot (Singles, current season), keyed by roster slug.
 * Not every species has data (low-usage species may be absent). Regenerate
 * with `npm run usage`.
 */
export const usageBySlug = raw as Record<string, PokemonUsage>;
