// Ingest the Pokémon Champions roster and write a normalized snapshot into
// src/lib/data/. See docs/DECISIONS.md — we own the data as a committed snapshot
// rather than calling the (fan-made) API at runtime.
//
// Usage: node scripts/ingest-pokemon.mjs
//
// Sources:
//   - championsbattledata.com /api/index — roster, per-form stats/types/abilities/
//     sprites, learnable moves (English names only).
//   - PokéAPI /pokemon-species — Korean/Japanese localized names.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INDEX_URL = "https://championsbattledata.com/api/index";
const ASSET_BASE = "https://championsbattledata.com";
const SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species";
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
);

const POKEMON_TYPES = new Set([
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

// Regional variants: localized prefixes applied to the base species name.
const REGION_PREFIX = {
  alolan: { ko: "알로라 ", ja: "アローラ" },
  galarian: { ko: "가라르 ", ja: "ガラル" },
  hisuian: { ko: "히스이 ", ja: "ヒスイ" },
  paldean: { ko: "팔데아 ", ja: "パルデア" },
};

/** "Dragon Claw" -> "dragon-claw". */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Bucket the many source form_kind labels into our coarse FormKind union. */
function mapKind(kind) {
  const s = String(kind).toLowerCase();
  if (s === "base") return "base";
  if (s.includes("mega")) return "mega";
  if (["alolan", "hisuian", "galarian", "paldean"].some((r) => s.includes(r))) {
    return "regional";
  }
  return "other";
}

/** Detect a regional-variant prefix from a Champions slug. */
function detectRegion(slug) {
  const m = slug.match(/^(alolan|galarian|hisuian|paldean)-/);
  return m ? m[1] : null;
}

/** Reduce a Champions slug to its base PokéAPI species slug. */
function toSpecies(slug) {
  return slug
    .replace(/^(alolan|galarian|hisuian|paldean)-/, "")
    .replace(/^rotom-(fan|frost|heat|mow|wash)$/, "rotom")
    .replace(/-(aqua|blaze|combat)-breed$/, "")
    .replace(/-(shield|blade)-forme$/, "")
    .replace(/-(male|female)$/, "")
    .replace(/-[a-z]+-(flower|variety|pattern)$/, "")
    .replace(/-(dusk|midnight|natural|zero|hero|hangry)-form$/, "")
    .replace(/-forme?$/, "");
}

/** Localized name for one form, from the base species names + form context. */
function formNames(form, kind, speciesNames, region) {
  const en = form.form_name;
  const koBase = speciesNames.ko;
  const jaBase = speciesNames.ja;
  if (kind === "mega" && koBase && jaBase) {
    const xy = / X$/.test(en) ? "X" : / Y$/.test(en) ? "Y" : "";
    return {
      ko: `메가${koBase}${xy ? ` ${xy}` : ""}`,
      en,
      ja: `メガ${jaBase}${xy}`,
    };
  }
  const prefix = region ? REGION_PREFIX[region] : null;
  return {
    ko: koBase ? `${prefix?.ko ?? ""}${koBase}` : en,
    en,
    ja: jaBase ? `${prefix?.ja ?? ""}${jaBase}` : en,
  };
}

function buildSprite(imagePath) {
  const path = String(imagePath ?? "").replace(/\\/g, "/");
  return path ? `${ASSET_BASE}/${encodeURI(path)}` : "";
}

function mapForm(f, speciesNames, region, warn) {
  const kind = mapKind(f.form_kind);
  const types = (f.types ?? []).map((t) => t.toLowerCase());
  for (const t of types) {
    if (!POKEMON_TYPES.has(t)) warn(`unknown type "${t}" on ${f.form_name}`);
  }
  return {
    name: f.form_name,
    kind,
    names: formNames(f, kind, speciesNames, region),
    sprite: buildSprite(f.image_path),
    types,
    baseStats: {
      // The source reports Lv50 / 31 IV / 0 EV / neutral stats. Invert that
      // formula to recover mainline base stats (exact — 31 IVs cancel the floor
      // terms): HP base = stat - 75, others = stat - 20.
      hp: f.hp - 75,
      atk: f.attack - 20,
      def: f.defense - 20,
      spa: f.sp_attack - 20,
      spd: f.sp_defense - 20,
      spe: f.speed - 20,
    },
    abilities: f.abilities ? f.abilities.split("|").filter(Boolean) : [],
  };
}

/** Run `fn` over `items` with bounded concurrency. */
async function pMap(items, fn, concurrency = 12) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function fetchSpeciesNames(base) {
  const res = await fetch(`${SPECIES_URL}/${base}`);
  if (!res.ok) return null;
  const data = await res.json();
  const byLang = Object.fromEntries(
    data.names.map((n) => [n.language.name, n.name]),
  );
  return { ko: byLang.ko ?? null, ja: byLang.ja ?? byLang["ja-Hrkt"] ?? null };
}

async function main() {
  const warnings = [];
  const warn = (m) => warnings.push(m);

  console.log(`Fetching ${INDEX_URL} …`);
  const res = await fetch(INDEX_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${INDEX_URL}`);
  const index = await res.json();

  // Fetch localized names once per unique base species.
  const uniqueBases = [...new Set(index.pokemon.map((e) => toSpecies(e.slug)))];
  console.log(
    `Fetching localized names for ${uniqueBases.length} species from PokéAPI …`,
  );
  const nameEntries = await pMap(uniqueBases, async (base) => {
    const names = await fetchSpeciesNames(base);
    if (!names) warn(`no PokéAPI species for "${base}"`);
    return [base, names ?? { ko: null, ja: null }];
  });
  const speciesNames = Object.fromEntries(nameEntries);

  const roster = index.pokemon.map((entry) => {
    const base = toSpecies(entry.slug);
    const region = detectRegion(entry.slug);
    const names = speciesNames[base] ?? { ko: null, ja: null };
    const forms = (entry.summary?.forms ?? []).map((f) =>
      mapForm(f, names, region, warn),
    );
    if (!names.ko) warn(`falling back to English for "${entry.slug}" (ko)`);
    const primary = forms[0];
    return {
      slug: entry.slug,
      // Species-level identity mirrors the primary form (used by list/detail pages).
      names: primary?.names ?? {
        ko: entry.name,
        en: entry.name,
        ja: entry.name,
      },
      sprite: primary?.sprite ?? "",
      forms,
      learnableMoves: (entry.learnableMoveNames ?? []).map(slugify),
    };
  });

  // Stable ordering so diffs stay small across re-ingests.
  roster.sort((a, b) => a.names.en.localeCompare(b.names.en));

  const meta = {
    sources: [INDEX_URL, SPECIES_URL],
    sourceDataVersion: index.dataVersion ?? null,
    sourceGeneratedAt: index.generatedAt ?? null,
    ingestedAt: new Date().toISOString(),
    count: roster.length,
    note: "Fan-sourced snapshot; not official. baseStats are mainline base stats (recovered from the source's Lv50/31IV/0EV/neutral values). Sprites are hotlinked.",
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "pokemon.json"),
    JSON.stringify(roster, null, 2) + "\n",
  );
  writeFileSync(
    join(OUT_DIR, "pokemon-meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
  );

  console.log(`Wrote ${roster.length} Pokémon to ${OUT_DIR}`);
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
