import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";

import type { PlaceSearchResponseDto } from "@/features/recovery/api/places";
import type { PlaceDetailResponseDto } from "@/features/recovery/place-detail/placeDetail";
import type { SimpleRecommendationResponse } from "@/features/recovery/simple/api/simpleRecommendations";

import { handlers } from "./handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("simple recovery MSW handlers", () => {
  it("returns mock place search results", async () => {
    const response = await fetch(
      "https://mock-api.test/api/v1/places/search?query=경포",
    );
    const body = (await response.json()) as PlaceSearchResponseDto;

    expect(response.ok).toBe(true);
    expect(body.places[0]?.source_id).toBe("8199114");
  });

  it("returns mock simple recommendations", async () => {
    const response = await fetch(
      "https://mock-api.test/api/v1/simple/recommendations",
      { method: "POST", body: JSON.stringify({}) },
    );
    const body = (await response.json()) as SimpleRecommendationResponse;

    expect(response.ok).toBe(true);
    expect(body.success).toBe(true);
    expect(body.data.ai_recommended).toHaveLength(1);
    expect(body.data.more_places).toHaveLength(2);
    expect(body.data.ai_recommended[0]?.image_url).toContain(
      "images.unsplash.com",
    );
  });

  it("returns mock place details", async () => {
    const response = await fetch(
      "https://mock-api.test/api/v1/places/8199114?source=kakao",
    );
    const body = (await response.json()) as PlaceDetailResponseDto;

    expect(response.ok).toBe(true);
    expect(body.success).toBe(true);
    if (body.success) {
      expect(body.data.name).toBe("경포해수욕장");
      expect(body.data.image_urls).toHaveLength(5);
      expect(
        body.data.image_urls.every((url) =>
          url.includes("images.unsplash.com"),
        ),
      ).toBe(true);
    }
  });

  it("returns 404 for an unknown mock place", async () => {
    const response = await fetch(
      "https://mock-api.test/api/v1/places/unknown?source=kakao",
    );
    const body = (await response.json()) as PlaceDetailResponseDto;

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
