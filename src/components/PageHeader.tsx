"use client";

import Link from "next/link";
import { useT, type TranslationKey } from "@/lib/i18n";

/** Back-home link + translated title/subtitle for calculator pages (issue #8). */
export function PageHeader({
  titleKey,
  subtitleKey,
  subtitleVars,
}: {
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /** Interpolation values for placeholders in the subtitle (e.g. `{n}`). */
  subtitleVars?: Record<string, string | number>;
}) {
  const t = useT();
  return (
    <header className="mb-6">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        {t("common.backHome")}
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{t(titleKey)}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t(subtitleKey, subtitleVars)}
      </p>
    </header>
  );
}
