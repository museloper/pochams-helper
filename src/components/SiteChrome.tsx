"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Site-title link in the header (translated, issue #8). */
export function SiteBrand() {
  const t = useT();
  return (
    <Link href="/" className="text-sm font-semibold">
      {t("site.brand")}
    </Link>
  );
}

/** Footer disclaimer (translated). */
export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
      <p>{t("footer.disclaimer1")}</p>
      <p className="mt-1">{t("footer.disclaimer2")}</p>
    </footer>
  );
}
