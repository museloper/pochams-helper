"use client";

import Link from "next/link";
import { roster } from "@/lib/data/pokemon";
import { useT, type TranslationKey } from "@/lib/i18n";

type Feature = {
  href?: string;
  emoji: string;
  /** Optional sprite shown instead of the emoji. */
  image?: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  ready: boolean;
};

/** Sprite of a species' base form, used for feature-card icons. */
function spriteFor(slug: string): string | undefined {
  return roster.find((p) => p.slug === slug)?.forms[0]?.sprite;
}

/** Sprite of a specific form (matched by English name), for feature-card icons. */
function formSpriteFor(slug: string, nameIncludes: string): string | undefined {
  const forms = roster.find((p) => p.slug === slug)?.forms ?? [];
  return forms.find((f) => f.names.en.includes(nameIncludes))?.sprite;
}

const FEATURES: Feature[] = [
  {
    href: "/pokemon",
    emoji: "📖",
    image: spriteFor("rotom"),
    titleKey: "home.dexTitle",
    descKey: "home.dexDesc",
    ready: true,
  },
  {
    href: "/speed",
    emoji: "⚡",
    image: spriteFor("pikachu"),
    titleKey: "speed.pageTitle",
    descKey: "home.speedDesc",
    ready: true,
  },
  {
    href: "/damage",
    emoji: "💥",
    image: formSpriteFor("gyarados", "Mega Gyarados"),
    titleKey: "damage.pageTitle",
    descKey: "home.damageDesc",
    ready: true,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const t = useT();
  return (
    <div
      className={
        feature.ready
          ? "flex h-full flex-col rounded-xl border border-gray-200 p-5 transition group-hover:border-gray-900 dark:border-gray-700 dark:group-hover:border-white"
          : "flex h-full flex-col rounded-xl border border-gray-200 p-5 opacity-60 dark:border-gray-700"
      }
    >
      {feature.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feature.image}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
      ) : (
        <span className="flex h-12 items-center text-3xl">{feature.emoji}</span>
      )}
      <span className="mt-3 font-semibold">{t(feature.titleKey)}</span>
      <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t(feature.descKey)}
      </span>
      <span
        className={
          feature.ready
            ? "mt-4 text-xs font-medium text-gray-900 dark:text-white"
            : "mt-4 text-xs text-gray-400"
        }
      >
        {feature.ready ? t("home.goto") : t("home.comingSoon")}
      </span>
    </div>
  );
}

export default function Home() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{t("site.brand")}</h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          {t("home.tagline")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) =>
          feature.ready && feature.href ? (
            <Link key={feature.titleKey} href={feature.href} className="group">
              <FeatureCard feature={feature} />
            </Link>
          ) : (
            <FeatureCard key={feature.titleKey} feature={feature} />
          ),
        )}
      </div>
    </main>
  );
}
