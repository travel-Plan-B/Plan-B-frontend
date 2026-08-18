import { http, HttpResponse } from "msw";

import { MOCK_PLACES } from "./data/places";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

// REQ-DETAIL-001 GET /api/v1/places/search
export const handlers = [
  http.get(`${BASE_URL}/places/search`, ({ request }) => {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const places = MOCK_PLACES.filter((place) => place.name.includes(query));
    return HttpResponse.json({ places });
  }),
];
