import { useQuery } from "@tanstack/react-query";

import { searchPlaces } from "@/features/recovery/api/places";

export const placeKeys = {
  all: ["places"] as const,
  search: (query: string) => [...placeKeys.all, "search", query] as const,
};

// 지역/장소명 검색 결과(사진·평점 포함이라 호출당 비용이 큼)는 같은
// 검색어면 하루 안에는 사실상 똑같이 나온다. staleTime을 안 정하면
// 기본값이 0이라, 캐시된 결과를 화면엔 바로 보여주면서도 뒤에서 조용히
// 다시 호출(백그라운드 revalidate)해버려 같은 검색어를 또 검색해도
// 매번 실제 API가 나간다 — 그 낭비를 막으려고 24시간으로 길게 잡는다.
const SEARCH_STALE_TIME_MS = 24 * 60 * 60 * 1000;

export function usePlaceSearchQuery(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: placeKeys.search(trimmed),
    queryFn: () => searchPlaces(trimmed),
    enabled: trimmed.length > 0,
    staleTime: SEARCH_STALE_TIME_MS,
    // gcTime(기본 5분)이 staleTime보다 짧으면, 검색 결과를 5분만 안 보고
    // 있어도(다른 화면으로 이동 등) 캐시 자체가 지워져서 staleTime 24시간이
    // 무의미해진다 — 같은 검색어로 돌아와도 다시 실제 API가 나간다.
    gcTime: SEARCH_STALE_TIME_MS,
  });
}
