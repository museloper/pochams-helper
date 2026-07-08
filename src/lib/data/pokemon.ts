import type { Pokemon } from "@/lib/types";
import raw from "./pokemon.json";
import meta from "./pokemon-meta.json";

/**
 * The Champions roster snapshot (see docs/DECISIONS.md — snapshot-owned data).
 * Regenerate with `npm run ingest`.
 */
export const roster = raw as Pokemon[];

/** Provenance of the snapshot (source, versions, ingest time). */
export const rosterMeta = meta;
