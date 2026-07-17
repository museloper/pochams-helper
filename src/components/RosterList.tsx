"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Pokemon, PokemonForm, PokemonType, StatKey } from "@/lib/types";
import { POKEMON_TYPES, STAT_KEYS } from "@/lib/types";
import { TYPE_INFO } from "@/lib/typeInfo";
import { asset } from "@/lib/basePath";
import { moves as moveDict } from "@/lib/data/moves";
import { useLanguage } from "@/stores/useLanguage";
import { useT } from "@/lib/i18n";
import { TypeBadge } from "@/components/TypeBadge";

// H·A·B·C·D·S stat sort options.
const STAT_SORTS: { key: StatKey; label: string }[] = [
  { key: "hp", label: "H" },
  { key: "atk", label: "A" },
  { key: "def", label: "B" },
  { key: "spa", label: "C" },
  { key: "spd", label: "D" },
  { key: "spe", label: "S" },
];

/** A single displayable card: a species' primary form, or one of its megas. */
type Unit = PokemonForm & {
  key: string;
  slug: string;
  hasPriority: boolean;
  hasWideGuard: boolean;
};

function bst(form: PokemonForm): number {
  return STAT_KEYS.reduce((sum, key) => sum + form.baseStats[key], 0);
}

/** Does this species learn a damaging priority move (선공기)? */
function hasPriorityMove(entry: Pokemon): boolean {
  return entry.learnableMoves.some((slug) => {
    const m = moveDict[slug];
    return m && m.category !== "status" && m.priority > 0;
  });
}

/**
 * Client-side roster grid. Name language and type / mega filters; the filters
 * live in a modal opened from the toolbar. Rendered from server-provided data,
 * so the initial HTML (Korean, unfiltered) is still prerendered for SEO.
 */
export function RosterList({ pokemon }: { pokemon: Pokemon[] }) {
  const lang = useLanguage((s) => s.lang);
  const t = useT();
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [megaOnly, setMegaOnly] = useState(false);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [wideGuardOnly, setWideGuardOnly] = useState(false);
  const [sortStat, setSortStat] = useState<StatKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState(false);

  // Persist filters across navigation (도감 → 상세 → 복귀) via sessionStorage.
  // `loaded` (state, not ref) gates saving until the restore has applied, so the
  // remount's first render can't overwrite storage with default values.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = sessionStorage.getItem("roster-filters");
      if (raw) {
        const f = JSON.parse(raw);
        if (Array.isArray(f.selectedTypes)) setSelectedTypes(f.selectedTypes);
        if (typeof f.megaOnly === "boolean") setMegaOnly(f.megaOnly);
        if (typeof f.priorityOnly === "boolean")
          setPriorityOnly(f.priorityOnly);
        if (typeof f.wideGuardOnly === "boolean")
          setWideGuardOnly(f.wideGuardOnly);
        if (f.sortStat === null || typeof f.sortStat === "string")
          setSortStat(f.sortStat);
        if (f.sortDir === "asc" || f.sortDir === "desc") setSortDir(f.sortDir);
      }
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const f = {
      selectedTypes,
      megaOnly,
      priorityOnly,
      wideGuardOnly,
      sortStat,
      sortDir,
    };
    try {
      sessionStorage.setItem("roster-filters", JSON.stringify(f));
    } catch {
      // ignore quota errors
    }
  }, [
    loaded,
    selectedTypes,
    megaOnly,
    priorityOnly,
    wideGuardOnly,
    sortStat,
    sortDir,
  ]);

  const MAX_TYPES = 2;
  const toggleType = (type: PokemonType) =>
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : prev.length < MAX_TYPES
          ? [...prev, type]
          : prev,
    );

  // Flatten to display units: each species' first non-mega form (source order
  // can list a mega first, e.g. Pinsir) plus its mega forms as separate cards.
  const units = useMemo<Unit[]>(
    () =>
      pokemon.flatMap((entry) => {
        const priority = hasPriorityMove(entry);
        const wideGuard = entry.learnableMoves.includes("wide-guard");
        const nonMega = entry.forms.filter((f) => f.kind !== "mega");
        const megas = entry.forms.filter((f) => f.kind === "mega");
        const shown = nonMega.length > 0 ? [nonMega[0], ...megas] : megas;
        return shown.map((form) => ({
          ...form,
          key: `${entry.slug}|${form.name}`,
          slug: entry.slug,
          hasPriority: priority,
          hasWideGuard: wideGuard,
        }));
      }),
    [pokemon],
  );

  const filtered = units.filter(
    (u) =>
      selectedTypes.every((t) => u.types.includes(t)) &&
      (!megaOnly || u.kind === "mega") &&
      (!priorityOnly || u.hasPriority) &&
      (!wideGuardOnly || u.hasWideGuard),
  );

  const sorted = sortStat
    ? [...filtered].sort((a, b) => {
        const diff = a.baseStats[sortStat] - b.baseStats[sortStat];
        return sortDir === "asc" ? diff : -diff;
      })
    : filtered;

  const filterCount =
    selectedTypes.length +
    (megaOnly ? 1 : 0) +
    (priorityOnly ? 1 : 0) +
    (wideGuardOnly ? 1 : 0) +
    (sortStat ? 1 : 0);

  useEffect(() => {
    if (!filterOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setFilterOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterOpen]);

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={t("dex.filter")}
          className="relative inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M3 4.5h18l-7.5 9v5l-3 1.5v-6.5z" />
          </svg>
          {t("dex.filter")}
          {filterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-gray-900 px-1.5 text-xs text-white dark:bg-white dark:text-gray-900">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <p className="mb-3 text-xs text-gray-400">
        {t("dex.countN", { n: filtered.length })}
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((unit) => (
          <li key={unit.key}>
            <Link
              href={`/pokemon/${unit.slug}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
            >
              {/* Sprite is hotlinked from the source; plain img avoids remote-image config. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={unit.sprite}
                alt={unit.names[lang]}
                width={64}
                height={64}
                loading="lazy"
                className="h-16 w-16 shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">
                    {unit.names[lang]}
                  </span>
                  {sortStat ? (
                    <span
                      className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-300"
                      title={t("dex.selectedStatTitle")}
                    >
                      {STAT_SORTS.find((s) => s.key === sortStat)?.label}{" "}
                      {unit.baseStats[sortStat]}
                    </span>
                  ) : (
                    <span
                      className="shrink-0 text-xs text-gray-400"
                      title={t("dex.bstTitle")}
                    >
                      {t("dex.bstN", { n: bst(unit) })}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {unit.types.map((type) => (
                    <TypeBadge key={type} type={type} />
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t("dex.filter")}</h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label={t("common.close")}
                className="rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-5 w-5"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("dex.type")}{" "}
              <span className="text-gray-400">{t("dex.typeHint")}</span>
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className={
                  selectedTypes.length === 0
                    ? "flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                    : "flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                {t("common.all")}
              </button>
              {POKEMON_TYPES.map((type) => {
                const info = TYPE_INFO[type];
                const active = selectedTypes.includes(type);
                const disabled = !active && selectedTypes.length >= MAX_TYPES;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleType(type)}
                    title={info[lang]}
                    aria-label={info[lang]}
                    aria-pressed={active}
                    className={
                      active
                        ? "rounded-lg ring-2 ring-gray-900 dark:ring-white"
                        : disabled
                          ? "rounded-lg opacity-25"
                          : "rounded-lg opacity-90 hover:opacity-100"
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(`/types/${type}.png`)}
                      alt={info[lang]}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg"
                    />
                  </button>
                );
              })}
            </div>

            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("dex.formsMoves")}
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setMegaOnly((v) => !v)}
                className={
                  megaOnly
                    ? "rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                {t("dex.megaOnly")}
              </button>
              <button
                type="button"
                onClick={() => setPriorityOnly((v) => !v)}
                className={
                  priorityOnly
                    ? "rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                {t("dex.priorityOnly")}
              </button>
              <button
                type="button"
                onClick={() => setWideGuardOnly((v) => !v)}
                className={
                  wideGuardOnly
                    ? "rounded-full bg-teal-500 px-3 py-1 text-xs font-medium text-white"
                    : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                {t("dex.wideGuard")}
              </button>
            </div>

            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("dex.sort")}{" "}
              <span className="text-gray-400">{t("dex.byStat")}</span>
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSortStat(null)}
                className={
                  sortStat === null
                    ? "rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                    : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                {t("dex.default")}
              </button>
              {STAT_SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSortStat(sortStat === s.key ? null : s.key)}
                  className={
                    sortStat === s.key
                      ? "h-7 w-7 rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900"
                      : "h-7 w-7 rounded-full border border-gray-200 text-xs font-bold text-gray-500 hover:border-gray-400 dark:border-gray-700"
                  }
                >
                  {s.label}
                </button>
              ))}
              {sortStat && (
                <button
                  type="button"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="ml-1 flex h-7 items-center rounded-full border border-gray-300 px-3 text-xs font-medium text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-300"
                >
                  {sortDir === "desc" ? t("dex.sortDesc") : t("dex.sortAsc")}
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedTypes([]);
                  setMegaOnly(false);
                  setPriorityOnly(false);
                  setWideGuardOnly(false);
                  setSortStat(null);
                  setSortDir("desc");
                }}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {t("dex.reset")}
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
              >
                {t("dex.viewN", { n: filtered.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
