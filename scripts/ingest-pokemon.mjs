// Ingest the Pokémon Champions roster and write a normalized snapshot into
// src/lib/data/. See docs/DECISIONS.md — we own the data as a committed snapshot
// rather than calling the (fan-made) API at runtime.
//
// Usage: node scripts/ingest-pokemon.mjs
//
// Sources:
//   - championsbattledata.com /api/index — roster, per-form stats/types/sprites,
//     learnable moves (English names only).
//   - PokéAPI /pokemon-species — Korean/Japanese localized names.
//   - PokéAPI /pokemon + /ability — abilities with hidden flag and Korean names.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const INDEX_URL = "https://championsbattledata.com/api/index";
const ASSET_BASE = "https://championsbattledata.com";
export const POKEAPI = "https://pokeapi.co/api/v2";
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
const REGION_WORD = {
  alolan: "Alolan",
  galarian: "Galarian",
  hisuian: "Hisuian",
  paldean: "Paldean",
};

// Official form names, keyed by entry slug, overriding the generic name builder
// for forms whose real names don't follow the "{종} ({desc})" pattern.
const NAME_OVERRIDES = {
  "rotom-heat": { ko: "히트로토무", en: "Heat Rotom", ja: "ヒートロトム" },
  "rotom-wash": { ko: "워시로토무", en: "Wash Rotom", ja: "ウォッシュロトム" },
  "rotom-frost": {
    ko: "프로스트로토무",
    en: "Frost Rotom",
    ja: "フロストロトム",
  },
  "rotom-fan": { ko: "스핀로토무", en: "Fan Rotom", ja: "スピンロトム" },
  "rotom-mow": { ko: "커트로토무", en: "Mow Rotom", ja: "カットロトム" },
  // Aegislash's default forme — drop the "(Shield Forme)" descriptor.
  "aegislash-shield-forme": {
    ko: "킬가르도",
    en: "Aegislash",
    ja: "ギルガルド",
  },
};

// PokéAPI default-variety keys for entries whose slug isn't a valid /pokemon id.
const POKE_DEFAULT_FORM = {
  lycanroc: "lycanroc-midday",
  meowstic: "meowstic-male",
  pyroar: "pyroar-male",
  mimikyu: "mimikyu-disguised",
  morpeko: "morpeko-full-belly",
  maushold: "maushold-family-of-four",
  gourgeist: "gourgeist-average",
  "gourgeist-jumbo-variety": "gourgeist-super",
  "gourgeist-large-variety": "gourgeist-large",
  "gourgeist-small-variety": "gourgeist-small",
  "vivillon-fancy-pattern": "vivillon-fancy",
};

/** "Dragon Claw" -> "dragon-claw"; "King's Shield" -> "kings-shield". */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanize(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
export function toSpecies(slug) {
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

/** Base species slug of a mega form, e.g. "Mega Charizard X" -> "charizard". */
function megaBaseSlug(formName) {
  return slugify(formName.replace(/^mega\s+/i, "").replace(/\s+(x|y)$/i, ""));
}

/** Candidate PokéAPI /pokemon ids for a Champions entry slug, best first. */
export function apiKeyCandidates(slug) {
  const c = [slug];
  const push = (v) => v && v !== slug && !c.includes(v) && c.push(v);
  const paldeanTauros = slug.match(/^paldean-tauros-(\w+)-breed$/);
  if (paldeanTauros) {
    push(`tauros-paldea-${paldeanTauros[1]}-breed`);
  } else {
    const m = slug.match(/^(alolan|galarian|hisuian|paldean)-(.+)$/);
    if (m) {
      const suffix = {
        alolan: "alola",
        galarian: "galar",
        hisuian: "hisui",
        paldean: "paldea",
      }[m[1]];
      push(`${m[2]}-${suffix}`);
    }
  }
  push(
    slug
      .replace(/-shield-forme$/, "-shield")
      .replace(/-blade-forme$/, "-blade"),
  );
  push(slug.replace(/-(dusk|midnight)-form$/, "-$1"));
  push(slug.replace(/-zero-form$/, "-zero"));
  push(slug.replace(/-natural-form$/, ""));
  push(POKE_DEFAULT_FORM[slug]);
  push(toSpecies(slug)); // base species — fine for cosmetic forms sharing abilities
  return c;
}

/** PokéAPI /pokemon id for a mega form, e.g. "Mega Charizard X" -> "charizard-mega-x". */
export function megaApiKey(formName) {
  const xy = / X$/.test(formName) ? "-x" : / Y$/.test(formName) ? "-y" : "";
  return `${megaBaseSlug(formName)}-mega${xy}`;
}

/** Localized name for a form. See docs for the naming rules. */
function localizedName(form, sp, region) {
  const en = form.name;
  if (form.kind === "mega" && sp.ko && sp.ja) {
    const xy = / X$/.test(en) ? " X" : / Y$/.test(en) ? " Y" : "";
    return { ko: `메가${sp.ko}${xy}`, en, ja: `メガ${sp.ja}${xy.trim()}` };
  }
  const prefix = region ? REGION_PREFIX[region] : null;
  let desc = en;
  const regionWord = region ? REGION_WORD[region] : null;
  if (regionWord && desc.toLowerCase().startsWith(regionWord.toLowerCase())) {
    desc = desc.slice(regionWord.length).trim();
  }
  if (sp.en && desc.toLowerCase().startsWith(sp.en.toLowerCase())) {
    desc = desc.slice(sp.en.length).trim();
  }
  const ko = sp.ko ? `${prefix?.ko ?? ""}${sp.ko}` : en;
  const ja = sp.ja ? `${prefix?.ja ?? ""}${sp.ja}` : en;
  return {
    ko: sp.ko && desc ? `${ko} (${desc})` : ko,
    en,
    ja: sp.ja && desc ? `${ja} (${desc})` : ja,
  };
}

function buildSprite(imagePath) {
  const path = String(imagePath ?? "").replace(/\\/g, "/");
  return path ? `${ASSET_BASE}/${encodeURI(path)}` : "";
}

/** Map a raw source form to our shape (localized names/abilities attached later). */
function mapForm(f, warn) {
  const types = (f.types ?? []).map((t) => t.toLowerCase());
  for (const t of types) {
    if (!POKEMON_TYPES.has(t)) warn(`unknown type "${t}" on ${f.form_name}`);
  }
  return {
    name: f.form_name,
    kind: mapKind(f.form_kind),
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
    // Source abilities (English, no hidden flag) — used only as a fallback.
    sourceAbilities: f.abilities ? f.abilities.split("|").filter(Boolean) : [],
  };
}

/** Run `fn` over `items` with bounded concurrency. */
export async function pMap(items, fn, concurrency = 16) {
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

export async function getJson(url) {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

async function fetchSpeciesNames(base) {
  const data = await getJson(`${POKEAPI}/pokemon-species/${base}`);
  if (!data) return null;
  const by = Object.fromEntries(
    data.names.map((n) => [n.language.name, n.name]),
  );
  return {
    ko: by.ko ?? null,
    ja: by.ja ?? by["ja-Hrkt"] ?? null,
    en: by.en ?? null,
  };
}

/** Resolve a form's abilities [{slug, hidden}] via the first matching /pokemon id. */
async function fetchAbilities(candidates) {
  for (const key of candidates) {
    const data = await getJson(`${POKEAPI}/pokemon/${key}`);
    if (data) {
      return data.abilities.map((a) => ({
        slug: a.ability.name,
        hidden: a.is_hidden,
      }));
    }
  }
  return null;
}

async function fetchAbilityName(slug) {
  const data = await getJson(`${POKEAPI}/ability/${slug}`);
  if (!data) return null;
  const by = Object.fromEntries(
    data.names.map((n) => [n.language.name, n.name]),
  );
  return {
    ko: by.ko ?? null,
    en: by.en ?? null,
    ja: by.ja ?? by["ja-Hrkt"] ?? null,
  };
}

async function fetchMove(slug) {
  const data = await getJson(`${POKEAPI}/move/${slug}`);
  if (!data) return null;
  const by = Object.fromEntries(
    data.names.map((n) => [n.language.name, n.name]),
  );
  return {
    slug,
    ko: by.ko ?? by.en ?? humanize(slug),
    en: by.en ?? humanize(slug),
    ja: by.ja ?? by["ja-Hrkt"] ?? by.en ?? humanize(slug),
    type: data.type?.name ?? "normal",
    category: data.damage_class?.name ?? "status",
    power: data.power ?? null,
    accuracy: data.accuracy ?? null,
    priority: data.priority ?? 0,
  };
}

async function main() {
  const warnings = [];
  const warn = (m) => warnings.push(m);

  console.log(`Fetching ${INDEX_URL} …`);
  const index = await getJson(INDEX_URL);
  if (!index) throw new Error(`failed to fetch ${INDEX_URL}`);

  // Localized species names, once per unique base species.
  const uniqueBases = [...new Set(index.pokemon.map((e) => toSpecies(e.slug)))];
  console.log(`Fetching species names for ${uniqueBases.length} species …`);
  const speciesNames = Object.fromEntries(
    await pMap(uniqueBases, async (base) => {
      const names = await fetchSpeciesNames(base);
      if (!names) warn(`no PokéAPI species for "${base}"`);
      return [base, names ?? { ko: null, ja: null, en: null }];
    }),
  );

  const roster = index.pokemon.map((entry) => {
    const base = toSpecies(entry.slug);
    const region = detectRegion(entry.slug);
    const sp = speciesNames[base] ?? { ko: null, ja: null, en: null };
    if (!sp.ko) warn(`falling back to English for "${entry.slug}" (ko)`);

    // The source lists a species' whole family in every entry, so pick the form
    // whose name matches this entry's slug as the representative — not forms[0].
    const raw = (entry.summary?.forms ?? []).map((f) => mapForm(f, warn));
    const rep = raw.find((f) => slugify(f.name) === entry.slug) ?? raw[0];
    if (!raw.some((f) => slugify(f.name) === entry.slug)) {
      warn(`no slug-matching form for "${entry.slug}", using forms[0]`);
    }
    const ownMegas = raw.filter(
      (f) => f.kind === "mega" && megaBaseSlug(f.name) === entry.slug,
    );

    const forms = [rep, ...ownMegas].filter(Boolean).map((f, i) => ({
      ...f,
      names:
        i === 0 && NAME_OVERRIDES[entry.slug]
          ? NAME_OVERRIDES[entry.slug]
          : localizedName(f, sp, region),
      // PokéAPI /pokemon id candidates for ability lookup.
      apiCandidates:
        f.kind === "mega"
          ? [megaApiKey(f.name), toSpecies(entry.slug)]
          : apiKeyCandidates(entry.slug),
    }));
    const primary = forms[0];
    return {
      slug: entry.slug,
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

  // Resolve abilities per form from PokéAPI (hidden flag), then localized names.
  const allForms = roster.flatMap((p) => p.forms);
  console.log(`Fetching abilities for ${allForms.length} forms …`);
  await pMap(allForms, async (f) => {
    f._abilities = await fetchAbilities(f.apiCandidates);
  });
  const abilitySlugs = [
    ...new Set(
      allForms.flatMap((f) => (f._abilities ?? []).map((a) => a.slug)),
    ),
  ];
  console.log(`Fetching names for ${abilitySlugs.length} abilities …`);
  const abilityNames = Object.fromEntries(
    await pMap(abilitySlugs, async (slug) => [
      slug,
      await fetchAbilityName(slug),
    ]),
  );

  for (const f of allForms) {
    if (f._abilities) {
      f.abilities = f._abilities.map((a) => {
        const n = abilityNames[a.slug];
        return {
          ko: n?.ko ?? n?.en ?? humanize(a.slug),
          en: n?.en ?? humanize(a.slug),
          ja: n?.ja ?? n?.en ?? humanize(a.slug),
          hidden: a.hidden,
        };
      });
    } else {
      warn(`abilities fallback (no PokéAPI match) for "${f.name}"`);
      f.abilities = f.sourceAbilities.map((en) => ({
        ko: en,
        en,
        ja: en,
        hidden: false,
      }));
    }
    delete f._abilities;
    delete f.apiCandidates;
    delete f.sourceAbilities;
  }

  // Move dictionary (shared across the roster): slug -> details.
  const moveSlugs = [
    ...new Set(roster.flatMap((p) => p.learnableMoves)),
  ].sort();
  console.log(`Fetching ${moveSlugs.length} moves …`);
  const moves = {};
  for (const [slug, move] of await pMap(moveSlugs, async (slug) => [
    slug,
    await fetchMove(slug),
  ])) {
    if (move) moves[slug] = move;
    else warn(`no move data for "${slug}"`);
  }
  // Drop move slugs we couldn't resolve so the app never references missing data.
  for (const p of roster) {
    p.learnableMoves = p.learnableMoves.filter((slug) => moves[slug]);
  }

  // Stable ordering so diffs stay small across re-ingests.
  roster.sort((a, b) => a.names.en.localeCompare(b.names.en));

  const meta = {
    sources: [
      INDEX_URL,
      `${POKEAPI}/pokemon-species`,
      `${POKEAPI}/pokemon`,
      `${POKEAPI}/ability`,
    ],
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
  writeFileSync(
    join(OUT_DIR, "moves.json"),
    JSON.stringify(moves, null, 2) + "\n",
  );

  console.log(
    `Wrote ${roster.length} Pokémon and ${Object.keys(moves).length} moves to ${OUT_DIR}`,
  );
  if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings.slice(0, 40)) console.warn(`  - ${w}`);
  }
}

// Only run the full ingest when executed directly, so helper functions can be
// imported (e.g. by scripts/add-weight.mjs) without side effects.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
