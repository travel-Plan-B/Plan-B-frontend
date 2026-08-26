import { useQuery } from "@tanstack/react-query";
import { getPlaceDetail, type PlaceSource } from "./placeDetail";

export const placeDetailKeys = {
  all: ["place-detail"] as const,
  detail: (placeId: string, source: PlaceSource) =>
    [...placeDetailKeys.all, placeId, source] as const,
};

export function usePlaceDetailQuery(
  placeId: string,
  source: PlaceSource | undefined,
) {
  return useQuery({
    queryKey: source
      ? placeDetailKeys.detail(placeId, source)
      : [...placeDetailKeys.all, placeId, "invalid"],
    queryFn: () => getPlaceDetail(placeId, source as PlaceSource),
    enabled: placeId.trim().length > 0 && source !== undefined,
    retry: 1,
  });
}
