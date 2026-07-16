// Augment the existing Pokémon snapshot with per-form weight (kg), needed for
// weight-based moves like Grass Knot / Low Kick (issue #6).
//
// Unlike a full re-ingest, this only adds the `weight` field to each form so the
// diff stays minimal. It reuses the ingest's PokéAPI id resolution.
//
// Usage: node scripts/add-weight.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  POKEAPI,
  getJson,
  pMap,
  toSpecies,
  megaApiKey,
  apiKeyCandidates,
} from "./ingest-pokemon.mjs";

const DATA = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
  "pokemon.json",
);

/** PokéAPI /pokemon id candidates for a given species slug + form. */
function candidatesFor(slug, form) {
  return form.kind === "mega"
    ? [megaApiKey(form.name), toSpecies(slug)]
    : apiKeyCandidates(slug);
}

/** Weight in kg from the first matching /pokemon id (PokéAPI reports hectograms). */
async function fetchWeight(candidates) {
  for (const key of candidates) {
    const data = await getJson(`${POKEAPI}/pokemon/${key}`);
    if (data && typeof data.weight === "number") return data.weight / 10;
  }
  return null;
}

async function main() {
  const roster = JSON.parse(readFileSync(DATA, "utf8"));
  const tasks = roster.flatMap((p) =>
    p.forms.map((form) => ({ slug: p.slug, form })),
  );
  console.log(`Fetching weight for ${tasks.length} forms …`);

  const warnings = [];
  await pMap(tasks, async ({ slug, form }) => {
    const weight = await fetchWeight(candidatesFor(slug, form));
    if (weight == null) {
      warnings.push(`no weight for "${form.name}" (${slug})`);
      form.weight = 0;
    } else {
      form.weight = weight;
    }
  });

  // Rebuild each form so `weight` sits right after `types` (matches the type),
  // keeping the existing field order otherwise for a minimal diff.
  for (const p of roster) {
    p.forms = p.forms.map((f) => ({
      name: f.name,
      kind: f.kind,
      sprite: f.sprite,
      types: f.types,
      weight: f.weight,
      baseStats: f.baseStats,
      names: f.names,
      abilities: f.abilities,
    }));
  }

  writeFileSync(DATA, JSON.stringify(roster, null, 2) + "\n");
  console.log(`Updated ${tasks.length} forms in ${DATA}`);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
