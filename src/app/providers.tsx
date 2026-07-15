"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLanguage } from "@/stores/useLanguage";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Rehydrate the persisted language after mount (store uses skipHydration).
  useEffect(() => {
    useLanguage.persist.rehydrate();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 포켓몬 데이터는 자주 바뀌지 않으므로 길게 캐싱
            staleTime: 1000 * 60 * 60,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
