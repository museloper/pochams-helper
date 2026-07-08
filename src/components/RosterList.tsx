"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language, Pokemon, PokemonForm, PokemonType } from "@/lib/types";
import { POKEMON_TYPES, STAT_KEYS } from "@/lib/types";
import { TYPE_INFO } from "@/lib/typeInfo";
import { TypeBadge } from "@/components/TypeBadge";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

/** A single displayable card: a species' primary form, or one of its megas. */
type Unit = PokemonForm & { key: string };

function bst(form: PokemonForm): number {
  return STAT_KEYS.reduce((sum, key) => sum + form.baseStats[key], 0);
}

/**
 * Client-side roster grid. Name language and type / mega filters; the filters
 * live in a modal opened from the toolbar. Rendered from server-provided data,
 * so the initial HTML (Korean, unfiltered) is still prerendered for SEO.
 */
export function RosterList({ pokemon }: { pokemon: Pokemon[] }) {
  const [lang, setLang] = useState<Language>("ko");
  const [selectedTypes, setSelectedTypes] = useState<PokemonType[]>([]);
  const [megaOnly, setMegaOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

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
        const nonMega = entry.forms.filter((f) => f.kind !== "mega");
        const megas = entry.forms.filter((f) => f.kind === "mega");
        const shown = nonMega.length > 0 ? [nonMega[0], ...megas] : megas;
        return shown.map((form) => ({
          ...form,
          key: `${entry.slug}|${form.name}`,
        }));
      }),
    [pokemon],
  );

  const filtered = units.filter(
    (u) =>
      selectedTypes.every((t) => u.types.includes(t)) &&
      (!megaOnly || u.kind === "mega"),
  );

  const filterCount = selectedTypes.length + (megaOnly ? 1 : 0);

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
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {LANGUAGES.map((language) => (
            <button
              key={language.value}
              type="button"
              onClick={() => setLang(language.value)}
              className={
                lang === language.value
                  ? "rounded-md bg-gray-900 px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                  : "rounded-md px-3 py-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }
            >
              {language.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="필터"
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
          필터
          {filterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-gray-900 px-1.5 text-xs text-white dark:bg-white dark:text-gray-900">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <p className="mb-3 text-xs text-gray-400">{filtered.length}종</p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((unit) => (
          <li
            key={unit.key}
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
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
                <span
                  className="shrink-0 text-xs text-gray-400"
                  title="종족값 총합"
                >
                  종족값 {bst(unit)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {unit.types.map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </div>
            </div>
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
              <h2 className="text-base font-semibold">필터</h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="닫기"
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
              타입{" "}
              <span className="text-gray-400">
                (최대 2개, 둘 다 가진 포켓몬)
              </span>
            </p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className={
                  selectedTypes.length === 0
                    ? "rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                    : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
                }
              >
                전체
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
                    style={{ backgroundColor: info.bg, color: info.fg }}
                    className={
                      active
                        ? "rounded-full px-3 py-1 text-xs font-medium ring-2 ring-gray-900 ring-offset-1 dark:ring-white dark:ring-offset-gray-900"
                        : disabled
                          ? "rounded-full px-3 py-1 text-xs font-medium opacity-25"
                          : "rounded-full px-3 py-1 text-xs font-medium opacity-80 hover:opacity-100"
                    }
                  >
                    {info.ko}
                  </button>
                );
              })}
            </div>

            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              폼
            </p>
            <button
              type="button"
              onClick={() => setMegaOnly((v) => !v)}
              className={
                megaOnly
                  ? "rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
              }
            >
              메가만
            </button>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedTypes([]);
                  setMegaOnly(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
              >
                {filtered.length}종 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
