// Augment the roster snapshot with competitive usage-rate data (moves, items,
// abilities, natures, EV spreads) from championsbattledata.com's own JSON API
// (see https://championsbattledata.com/api_guide). This is the same source
// already used for roster ingest — see docs/DECISIONS.md.
//
// Usage stats are tracked per species only (mega forms share their base
// species' entry; a Mega Stone just shows up as a held-item option), so this
// writes one entry per roster slug, not per form.
//
// Usage: node scripts/add-usage.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { POKEAPI, getJson, pMap } from "./ingest-pokemon.mjs";

const API_BASE = "https://championsbattledata.com/api";
const FORMAT = "Singles";

/** "Never-Melt Ice" -> "never-melt-ice"; "King's Rock" -> "kings-rock". */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Localized names (한/영/일) from a PokéAPI `names` array. */
function localizedFromPokeApi(names, fallback) {
  const by = Object.fromEntries(names.map((n) => [n.language.name, n.name]));
  return {
    ko: by.ko ?? fallback,
    en: by.en ?? fallback,
    ja: by.ja ?? by["ja-Hrkt"] ?? fallback,
  };
}

/** Resolve a teammate's English display name to a roster entry `{...names,
 * sprite}`. Tries exact form/species name, then slug, then base-species prefix. */
function buildTeammateResolver(roster) {
  const byEn = new Map();
  const bySlug = new Map();
  const species = [];
  const add = (map, key, names, sprite) => {
    if (!map.has(key)) map.set(key, { ...names, sprite });
  };
  for (const p of roster) {
    add(bySlug, p.slug, p.names, p.sprite);
    species.push({ en: p.names.en, val: { ...p.names, sprite: p.sprite } });
    add(byEn, p.names.en, p.names, p.sprite);
    for (const f of p.forms) add(byEn, f.names.en, f.names, f.sprite);
  }
  return (name) => {
    const exact = byEn.get(name);
    if (exact) return exact;
    const bySlugHit = bySlug.get(slugify(name));
    if (bySlugHit) return bySlugHit;
    const prefix = species.find((s) => name.startsWith(s.en));
    if (prefix) return prefix.val;
    return { ko: name, en: name, ja: name, sprite: "" };
  };
}

/** Fetch localized names + sprite from PokéAPI for a set of English item names. */
async function fetchItemData(names) {
  const entries = await pMap(
    [...names],
    async (name) => {
      const data = await getJson(`${POKEAPI}/item/${slugify(name)}`);
      const loc = data
        ? localizedFromPokeApi(data.names, name)
        : { ko: name, en: name, ja: name };
      const icon = data?.sprites?.default ?? "";
      return [name, { ...loc, icon }];
    },
    8,
  );
  return new Map(entries);
}

const ROSTER_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
  "pokemon.json",
);
const OUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "lib",
  "data",
  "usage.json",
);

/** Fetch JSON with a few retries, tolerating transient errors (returns null
 * only after all attempts fail — the third-party API intermittently rejects). */
async function safeGetJson(url, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // retry
    }
    if (i < attempts - 1)
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

/** Round to 1 decimal place; the source already provides this precision. */
function round1(n) {
  return Math.round(n * 10) / 10;
}

const STAT_FIELDS = [
  ["hp", "hp_points"],
  ["atk", "attack_points"],
  ["def", "defense_points"],
  ["spa", "sp_atk_points"],
  ["spd", "sp_def_points"],
  ["spe", "speed_points"],
];

/** Normalize one species' battle-data rows into our PokemonUsage shape. */
function normalize(data) {
  const rows = data.rows ?? [];
  if (rows.length === 0) return null;

  const byCategory = (cat) => rows.filter((r) => r.category === cat);

  const moves = byCategory("move").map((r) => ({
    name: r.name,
    pct: round1(r.percentage_value),
  }));
  const items = byCategory("held_item").map((r) => ({
    name: r.name,
    pct: round1(r.percentage_value),
  }));
  const abilities = byCategory("ability").map((r) => ({
    name: r.name,
    pct: round1(r.percentage_value),
  }));
  const natures = byCategory("stat_alignment").map((r) => ({
    name: r.name,
    pct: round1(r.percentage_value),
    statUp: r.stat_up,
    statDown: r.stat_down,
  }));
  const evSpreads = byCategory("stat_points").map((r) => ({
    pct: round1(r.percentage_value),
    evs: Object.fromEntries(
      STAT_FIELDS.map(([key, field]) => [key, Number(r[field]) || 0]),
    ),
  }));
  const teammates = byCategory("teammate").map((r) => ({ name: r.name }));

  return {
    season: data.season,
    moves,
    items,
    abilities,
    natures,
    evSpreads,
    teammates,
  };
}

async function main() {
  const roster = JSON.parse(readFileSync(ROSTER_PATH, "utf8"));

  console.log(`Fetching ${API_BASE}/index …`);
  const index = await safeGetJson(`${API_BASE}/index`);
  if (!index) throw new Error("failed to fetch championsbattledata /api/index");
  const showdownIdBySlug = new Map(
    index.pokemon.map((e) => [e.slug, e.showdownId]),
  );

  const warnings = [];
  console.log(`Fetching ${FORMAT} usage for ${roster.length} species …`);
  const entries = await pMap(
    roster,
    async (p) => {
      const showdownId = showdownIdBySlug.get(p.slug);
      if (!showdownId) {
        warnings.push(`no showdownId for "${p.slug}"`);
        return null;
      }
      const data = await safeGetJson(
        `${API_BASE}/battle/${FORMAT}/${showdownId}`,
      );
      if (!data) {
        warnings.push(`no usage data for "${p.slug}" (${showdownId})`);
        return null;
      }
      const usage = normalize(data);
      return usage ? [p.slug, usage] : null;
    },
    // Modest concurrency — this hits a third-party site once per species.
    6,
  );

  const raw = entries.filter(Boolean);

  // Localize item names via PokéAPI (once per unique item) and teammate names
  // via the roster, so usage.json carries display-ready 한/영/일 names.
  const uniqueItems = new Set();
  for (const [, u] of raw) for (const it of u.items) uniqueItems.add(it.name);
  console.log(`Fetching ${uniqueItems.size} item names from PokéAPI …`);
  const itemData = await fetchItemData(uniqueItems);
  const resolveTeammate = buildTeammateResolver(roster);
  const rosterBySlug = new Map(roster.map((p) => [p.slug, p]));

  /**
   * Localize one held item (name + sprite). Champions-original mega stones
   * (e.g. Meganiumite) don't exist in PokéAPI, so it leaves them English-only
   * and spriteless. They only appear on their own holder's page and follow the
   * "{species}나이트 / {species}ナイト" convention — so build the name from the
   * holder species (which has official localized names).
   */
  function localizeItem(itemName, holder) {
    const loc = itemData.get(itemName) ?? {
      ko: itemName,
      en: itemName,
      ja: itemName,
      icon: "",
    };
    const isMegaStone = /ite( [XY])?$/.test(itemName);
    const holderHasMega = holder?.forms.some((f) => f.kind === "mega");
    if (loc.ko === loc.en && isMegaStone && holderHasMega) {
      const suffix = itemName.match(/ ([XY])$/)?.[1];
      const xy = suffix ? ` ${suffix}` : "";
      return {
        ko: `${holder.names.ko}나이트${xy}`,
        en: itemName,
        ja: `${holder.names.ja}ナイト${xy}`,
        icon: loc.icon,
      };
    }
    return loc;
  }

  const usage = Object.fromEntries(
    raw.map(([slug, u]) => {
      const holder = rosterBySlug.get(slug);
      return [
        slug,
        {
          ...u,
          items: u.items.map((it) => ({
            ...localizeItem(it.name, holder),
            pct: it.pct,
          })),
          teammates: u.teammates.map((tm) => resolveTeammate(tm.name)),
        },
      ];
    }),
  );

  writeFileSync(OUT_PATH, JSON.stringify(usage, null, 2) + "\n");
  console.log(
    `Wrote usage data for ${Object.keys(usage).length}/${roster.length} species to ${OUT_PATH}`,
  );
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings.slice(0, 40)) console.warn(`  - ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
