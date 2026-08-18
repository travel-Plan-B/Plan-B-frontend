"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { MockProvider } from "@/mocks/MockProvider";
import { createQueryClient } from "@/shared/lib/query/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  // 요청/렌더마다 새 인스턴스가 생기지 않도록 useState로 한 번만 생성한다.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <MockProvider>{children}</MockProvider>
    </QueryClientProvider>
  );
}
