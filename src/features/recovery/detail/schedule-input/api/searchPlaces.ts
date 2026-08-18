import { fetchClient } from "@/shared/lib/api/fetchClient";
import type { Place } from "./types";

interface SearchPlacesResponse {
  places: Place[];
}

// REQ-DETAIL-001 GET /api/v1/places/search
export async function searchPlaces(query: string): Promise<Place[]> {
  const { places } = await fetchClient<SearchPlacesResponse>(
    `/places/search?query=${encodeURIComponent(query)}`,
  );
  return places;
}
