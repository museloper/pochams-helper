import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Language } from "@/lib/types";

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
}

/**
 * Global display language (name localization) shared across all pages.
 * Persisted to localStorage. `skipHydration` keeps the first client render
 * matching the prerendered HTML (Korean); Providers rehydrates after mount.
 */
export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      lang: "ko",
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "pochams-lang",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
