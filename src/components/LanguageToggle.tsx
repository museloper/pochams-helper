"use client";

import type { Language } from "@/lib/types";
import { useLanguage } from "@/stores/useLanguage";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "ko", label: "한" },
  { value: "en", label: "EN" },
  { value: "ja", label: "日" },
];

/** Global display-language switcher (shown in the site header). */
export function LanguageToggle() {
  const lang = useLanguage((s) => s.lang);
  const setLang = useLanguage((s) => s.setLang);
  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
      {LANGUAGES.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value)}
          aria-pressed={lang === l.value}
          className={
            lang === l.value
              ? "rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-gray-900"
              : "rounded-md px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
