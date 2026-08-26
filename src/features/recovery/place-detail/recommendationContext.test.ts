import { describe, expect, it } from "vitest";

import {
  getRecommendationContext,
  saveRecommendationContext,
} from "./recommendationContext";

describe("recommendation context", () => {
  it("stores only the recommendation context for a simple recovery place", () => {
    saveRecommendationContext({
      placeId: "simple-place",
      source: "kakao",
      previousPlaceName: "인사동",
      travelTimeFromPrevMinutes: 12,
      estimatedDurationMinutes: 60,
      recommendReasons: ["현재 조건에 적합해요"],
    });

    expect(getRecommendationContext("simple-place", "kakao")).toMatchObject({
      previousPlaceName: "인사동",
      travelTimeFromPrevMinutes: 12,
      estimatedDurationMinutes: 60,
      recommendReasons: ["현재 조건에 적합해요"],
    });
  });

  it("separates contexts for the same place by schedule item", () => {
    saveRecommendationContext({
      placeId: "shared-place",
      source: "tourapi",
      itemId: "item-1",
      previousPlaceName: "첫 번째 이전 일정",
    });
    saveRecommendationContext({
      placeId: "shared-place",
      source: "tourapi",
      itemId: "item-2",
      previousPlaceName: "두 번째 이전 일정",
    });

    expect(
      getRecommendationContext("shared-place", "tourapi", "item-1")
        ?.previousPlaceName,
    ).toBe("첫 번째 이전 일정");
    expect(
      getRecommendationContext("shared-place", "tourapi", "item-2")
        ?.previousPlaceName,
    ).toBe("두 번째 이전 일정");
  });

  it("returns no context for direct detail access", () => {
    expect(getRecommendationContext("unknown-place", "kakao")).toBeUndefined();
  });
});
