import { useQuery } from "@tanstack/react-query";

import { searchPlaces } from "./searchPlaces";

// query key는 이 feature가 소유한다 (folder-structure.md 참고).
export const placeKeys = {
  search: (query: string) => ["places", "search", query] as const,
};

export function usePlacesSearchQuery(query: string) {
  return useQuery({
    queryKey: placeKeys.search(query),
    queryFn: () => searchPlaces(query),
    // 검색어가 비어 있으면 요청 자체를 보내지 않는다.
    enabled: query.trim().length > 0,
  });
}
