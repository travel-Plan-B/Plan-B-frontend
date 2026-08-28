import { describe, expect, it } from "vitest";

import { toSimpleRecommendationRequest } from "./simpleRecommendations";

const REQUESTED_AT = new Date(2026, 0, 1, 10, 30);

describe("simple recommendation request mapper", () => {
  it("serializes the selected place identity with backend field names", () => {
    expect(
      toSimpleRecommendationRequest(
        {
          placeId: "737751726",
          providerSource: "kakao",
          currentLocation: { lat: 37.4253769, lng: 126.7004443 },
          deadlineTime: "14:00",
          transport: "transit",
          problemReason: "weather",
        },
        REQUESTED_AT,
      ),
    ).toMatchObject({
      place_id: "737751726",
      source: "kakao",
      current_location: { lat: 37.4253769, lng: 126.7004443 },
    });
  });

  it("does not serialize a partial place identity", () => {
    const request = toSimpleRecommendationRequest(
      {
        placeId: "737751726",
        currentLocation: { lat: 37.4253769, lng: 126.7004443 },
        deadlineTime: "14:00",
        transport: "car",
        problemReason: "closed",
      },
      REQUESTED_AT,
    );

    expect(request).not.toHaveProperty("place_id");
    expect(request).not.toHaveProperty("source");
  });
});
