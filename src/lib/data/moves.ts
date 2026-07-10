import type { Move } from "@/lib/types";
import raw from "./moves.json";

/**
 * Move dictionary shared across the roster (slug → details). Regenerate with
 * `npm run ingest`. Pokémon reference moves by slug via `learnableMoves`.
 */
export const moves = raw as Record<string, Move>;
