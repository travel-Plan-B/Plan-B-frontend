import { QueryClient } from "@tanstack/react-query";

// 요청마다 새 QueryClient를 만들지 않도록 팩토리로 분리 (Provider에서 useState(createQueryClient)로 사용).
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}
