import { useQuery } from "@tanstack/react-query";

import { searchPlaces } from "@/features/recovery/api/places";

export const placeKeys = {
  all: ["places"] as const,
  search: (query: string) => [...placeKeys.all, "search", query] as const,
};

export function usePlaceSearchQuery(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: placeKeys.search(trimmed),
    queryFn: () => searchPlaces(trimmed),
    enabled: trimmed.length > 0,
  });
}
