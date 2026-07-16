"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Back-to-dex link on the Pokémon detail page (translated, issue #8). */
export function DexBackLink() {
  const t = useT();
  return (
    <Link
      href="/pokemon"
      className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
    >
      {t("detail.backToDex")}
    </Link>
  );
}

/** "Learnable moves (N)" section heading. */
export function LearnableMovesHeading({ count }: { count: number }) {
  const t = useT();
  return (
    <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
      {t("detail.learnableMoves", { n: count })}
    </h3>
  );
}
