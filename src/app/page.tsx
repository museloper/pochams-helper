import Link from "next/link";

type Feature = {
  href?: string;
  emoji: string;
  title: string;
  desc: string;
  ready: boolean;
};

const FEATURES: Feature[] = [
  {
    href: "/pokemon",
    emoji: "📖",
    title: "포켓몬 도감",
    desc: "로스터 · 종족값 · 타입",
    ready: true,
  },
  {
    href: "/speed",
    emoji: "⚡",
    title: "스피드 계산기",
    desc: "성격·노력치별 스피드 라인 비교",
    ready: true,
  },
  {
    emoji: "🔀",
    title: "상성 계산기",
    desc: "타입별 공·방 상성 배율",
    ready: false,
  },
  {
    emoji: "💥",
    title: "데미지 계산기",
    desc: "실전 데미지 계산",
    ready: false,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      className={
        feature.ready
          ? "flex h-full flex-col rounded-xl border border-gray-200 p-5 transition group-hover:border-gray-900 dark:border-gray-700 dark:group-hover:border-white"
          : "flex h-full flex-col rounded-xl border border-gray-200 p-5 opacity-60 dark:border-gray-700"
      }
    >
      <span className="text-3xl">{feature.emoji}</span>
      <span className="mt-3 font-semibold">{feature.title}</span>
      <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {feature.desc}
      </span>
      <span
        className={
          feature.ready
            ? "mt-4 text-xs font-medium text-gray-900 dark:text-white"
            : "mt-4 text-xs text-gray-400"
        }
      >
        {feature.ready ? "바로가기 →" : "준비 중"}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">포켓몬 챔피언스 헬퍼</h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          팀 빌딩 · 상성 계산 · 데미지 계산
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) =>
          feature.ready && feature.href ? (
            <Link key={feature.title} href={feature.href} className="group">
              <FeatureCard feature={feature} />
            </Link>
          ) : (
            <FeatureCard key={feature.title} feature={feature} />
          ),
        )}
      </div>
    </main>
  );
}
