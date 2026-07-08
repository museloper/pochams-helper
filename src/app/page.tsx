export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">포켓몬 챔피언스 헬퍼</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400">
        팀 빌딩 · 상성 계산 · 데미지 계산
      </p>
      <ul className="flex gap-4 text-sm text-gray-400 dark:text-gray-500">
        <li className="rounded-full border border-gray-200 px-4 py-1.5 dark:border-gray-700">
          팀 빌더 (준비 중)
        </li>
        <li className="rounded-full border border-gray-200 px-4 py-1.5 dark:border-gray-700">
          상성 계산기 (준비 중)
        </li>
        <li className="rounded-full border border-gray-200 px-4 py-1.5 dark:border-gray-700">
          데미지 계산기 (준비 중)
        </li>
      </ul>
    </main>
  );
}
