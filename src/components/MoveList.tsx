"use client";

import { useState } from "react";
import type { Move, MoveCategory, PokemonType } from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/types";
import { asset } from "@/lib/basePath";
import { useLanguage } from "@/stores/useLanguage";
import { useT, type TranslationKey } from "@/lib/i18n";
import { TypeBadge } from "@/components/TypeBadge";

const CATEGORIES: {
  value: MoveCategory;
  labelKey: TranslationKey;
  badge: string;
}[] = [
  {
    value: "physical",
    labelKey: "common.physical",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    value: "special",
    labelKey: "common.special",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    value: "status",
    labelKey: "common.status",
    badge: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  },
];
const CATEGORY_BY_VALUE = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
);

function CategoryBadge({ category }: { category: MoveCategory }) {
  const t = useT();
  const c = CATEGORY_BY_VALUE[category];
  return (
    <span
      className={`shrink-0 rounded px-1 text-[10px] font-medium ${c.badge}`}
    >
      {t(c.labelKey)}
    </span>
  );
}

/** Learnable moves grouped by type, with type / category filters. */
export function MoveList({ moves }: { moves: Move[] }) {
  const lang = useLanguage((s) => s.lang);
  const t = useT();
  const [typeFilter, setTypeFilter] = useState<PokemonType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<MoveCategory | null>(
    null,
  );

  const presentTypes = POKEMON_TYPES.filter((t) =>
    moves.some((m) => m.type === t),
  );
  const filtered = moves.filter(
    (m) =>
      (typeFilter === null || m.type === typeFilter) &&
      (categoryFilter === null || m.category === categoryFilter),
  );
  const groups = presentTypes
    .map((type) => ({
      type,
      list: filtered
        .filter((m) => m.type === type)
        .sort((a, b) => (b.power ?? 0) - (a.power ?? 0)),
    }))
    .filter((g) => g.list.length > 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={
              categoryFilter === null
                ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }
          >
            {t("common.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() =>
                setCategoryFilter(categoryFilter === c.value ? null : c.value)
              }
              className={
                categoryFilter === c.value
                  ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
                  : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setTypeFilter(null)}
          className={
            typeFilter === null
              ? "flex h-8 items-center rounded-md bg-gray-900 px-2.5 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
              : "flex h-8 items-center rounded-md border border-gray-200 px-2.5 text-xs text-gray-500 hover:border-gray-400 dark:border-gray-700"
          }
        >
          {t("common.all")}
        </button>
        {presentTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            aria-pressed={typeFilter === type}
            className={
              typeFilter === type
                ? "rounded-md ring-2 ring-gray-900 dark:ring-white"
                : "rounded-md opacity-90 hover:opacity-100"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(`/types/${type}.png`)}
              alt={type}
              width={32}
              height={32}
              className="h-8 w-8 rounded-md"
            />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.type}>
            <div className="mb-1.5 flex items-center gap-2">
              <TypeBadge type={group.type} />
              <span className="text-xs text-gray-400">{group.list.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {group.list.map((move) => (
                <div
                  key={move.slug}
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm dark:border-gray-700"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CategoryBadge category={move.category} />
                    <span className="truncate">{move[lang]}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                    {move.category === "status"
                      ? t("common.status")
                      : t("move.power", { power: move.power ?? "-" })}{" "}
                    · {t("move.accuracy", { acc: move.accuracy ?? "-" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-gray-400">{t("moveList.empty")}</p>
        )}
      </div>
    </div>
  );
}
