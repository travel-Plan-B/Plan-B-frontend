import { fetchClient } from "@/shared/lib/api/fetchClient";
import { type Place, type PlaceSearchResponseDto, toPlace } from "./types";

export async function searchPlaces(query: string): Promise<Place[]> {
  const data = await fetchClient<PlaceSearchResponseDto>(
    "/api/v1/places/search",
    { params: { query } },
  );
  return data.places.map(toPlace);
}
