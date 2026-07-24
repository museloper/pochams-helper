"use client";

import type { ReactNode } from "react";
import type { Pokemon, PokemonUsage, StatKey } from "@/lib/types";
import { moves as moveDict } from "@/lib/data/moves";
import { NATURE_NAMES } from "@/lib/natureNames";
import { useLanguage } from "@/stores/useLanguage";
import { useT, type TranslationKey } from "@/lib/i18n";
import { TypeBadge } from "@/components/TypeBadge";

// Reverse lookup (English move name -> move) built once; moveDict is a
// static import so this never needs to be recomputed per render/mount.
const moveByEn = new Map(Object.values(moveDict).map((m) => [m.en, m]));

const EV_STAT_KEYS: { key: StatKey; labelKey: TranslationKey }[] = [
  { key: "hp", labelKey: "stat.hp" },
  { key: "atk", labelKey: "stat.attack" },
  { key: "def", labelKey: "stat.defense" },
  { key: "spa", labelKey: "stat.spAttack" },
  { key: "spd", labelKey: "stat.spDefense" },
  { key: "spe", labelKey: "stat.speed" },
];

const STAT_NAME_KEY: Record<string, TranslationKey> = {
  HP: "stat.hp",
  Attack: "stat.attack",
  Defense: "stat.defense",
  "Sp. Atk": "stat.spAttack",
  "Sp. Def": "stat.spDefense",
  Speed: "stat.speed",
};

/** Thin adoption-rate bar shared by every usage row. */
function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      <div
        className="h-full rounded-full bg-gray-900 dark:bg-white"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

/** Small square sprite (item icon / teammate) with a subtle surface tile. */
function Sprite({
  src,
  alt,
  size = 24,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <span
        className="shrink-0 rounded-md bg-gray-100 dark:bg-gray-800"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function Row({
  label,
  pct,
  leading,
}: {
  label: string;
  pct: number;
  leading?: ReactNode;
}) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm">
        {leading}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 text-xs font-medium text-gray-500 tabular-nums dark:text-gray-400">
          {pct}%
        </span>
      </div>
      <Bar pct={pct} />
    </li>
  );
}

/**
 * Competitive usage-rate summary (moves/items/abilities/natures/EV spreads),
 * sourced from championsbattledata.com's own usage API (see
 * scripts/add-usage.mjs). Tracked per species, not per form.
 */
export function UsageSection({
  pokemon,
  usage,
}: {
  pokemon: Pokemon;
  usage: PokemonUsage;
}) {
  const lang = useLanguage((s) => s.lang);
  const t = useT();

  // Ability names are localized via this species' own forms (no need to scan
  // the whole roster — usage abilities are necessarily one of this species').
  const abilityLabel = (en: string) => {
    for (const form of pokemon.forms) {
      const found = form.abilities.find((a) => a.en === en);
      if (found) return found[lang];
    }
    return en;
  };

  const evSpreadLabel = (evs: PokemonUsage["evSpreads"][number]["evs"]) =>
    EV_STAT_KEYS.filter(({ key }) => evs[key] > 0)
      .map(({ key, labelKey }) => `${t(labelKey)}${evs[key]}`)
      .join(" ");

  const natureLabel = (n: PokemonUsage["natures"][number]) => {
    const name = NATURE_NAMES[n.name]?.[lang] ?? n.name;
    if (!n.statUp || !n.statDown) return name;
    const up = t(STAT_NAME_KEY[n.statUp] ?? "stat.hp");
    const down = t(STAT_NAME_KEY[n.statDown] ?? "stat.hp");
    return `${name} (+${up}/-${down})`;
  };

  const H4 =
    "mb-3 text-[11px] font-semibold tracking-wide text-gray-400 uppercase";

  return (
    <section className="mt-4 rounded-2xl border border-gray-200 p-5 sm:p-7 dark:border-gray-800">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold">{t("usage.title")}</h3>
        <span className="text-xs text-gray-400">
          {t("usage.seasonNote", { season: usage.season })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
        {usage.moves.length > 0 && (
          <div>
            <h4 className={H4}>{t("usage.moves")}</h4>
            <ul className="space-y-3.5">
              {usage.moves.slice(0, 8).map((m) => {
                const move = moveByEn.get(m.name);
                return (
                  <Row
                    key={m.name}
                    label={move ? move[lang] : m.name}
                    pct={m.pct}
                    leading={move && <TypeBadge type={move.type} />}
                  />
                );
              })}
            </ul>
          </div>
        )}

        {usage.items.length > 0 && (
          <div>
            <h4 className={H4}>{t("usage.items")}</h4>
            <ul className="space-y-3.5">
              {usage.items.slice(0, 6).map((it) => (
                <Row
                  key={it.en}
                  label={it[lang]}
                  pct={it.pct}
                  leading={<Sprite src={it.icon} alt="" size={22} />}
                />
              ))}
            </ul>
          </div>
        )}

        {usage.abilities.length > 0 && (
          <div>
            <h4 className={H4}>{t("common.ability")}</h4>
            <ul className="space-y-3.5">
              {usage.abilities.map((a) => (
                <Row key={a.name} label={abilityLabel(a.name)} pct={a.pct} />
              ))}
            </ul>
          </div>
        )}

        {usage.natures.length > 0 && (
          <div>
            <h4 className={H4}>{t("usage.natures")}</h4>
            <ul className="space-y-3.5">
              {usage.natures.slice(0, 5).map((n) => (
                <Row key={n.name} label={natureLabel(n)} pct={n.pct} />
              ))}
            </ul>
          </div>
        )}

        {usage.evSpreads.length > 0 && (
          <div>
            <h4 className={H4}>{t("usage.evSpreads")}</h4>
            <ul className="space-y-3.5">
              {usage.evSpreads.slice(0, 4).map((s, i) => (
                <Row key={i} label={evSpreadLabel(s.evs)} pct={s.pct} />
              ))}
            </ul>
          </div>
        )}

        {usage.teammates.length > 0 && (
          <div>
            <h4 className={H4}>{t("usage.teammates")}</h4>
            <div className="flex flex-wrap gap-2">
              {usage.teammates.slice(0, 6).map((tm) => (
                <span
                  key={tm.en}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pr-3 pl-1 text-xs dark:border-gray-700"
                >
                  <Sprite src={tm.sprite} alt="" size={24} />
                  {tm[lang]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
