import { http, HttpResponse } from "msw";
import type { PlaceSearchResponseDto } from "@/features/recovery/api/places";
import { findMockPlaces } from "@/features/recovery/detail/mocks/placeMock";

export const handlers = [
  http.get("*/api/v1/places/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const places = findMockPlaces(query);

    return HttpResponse.json<PlaceSearchResponseDto>({
      count: places.length,
      places,
    });
  }),
];
