import { describe, expect, it } from "vitest";

import { compareRecommendationDistance } from "./recommendationDistance";

describe("simple recommendation distance sort", () => {
  it("sorts by the numeric distance shown on cards", () => {
    const candidates = [
      { id: "far", distanceKm: 7.9 },
      { id: "near", distanceKm: 1.2 },
    ];

    expect(
      candidates.sort(compareRecommendationDistance).map(({ id }) => id),
    ).toEqual(["near", "far"]);
  });

  it("keeps candidates without coordinates at the end without returning NaN", () => {
    const missingA = { id: "missing-a", distanceKm: null };
    const missingB = { id: "missing-b", distanceKm: null };
    const candidates = [missingA, { id: "known", distanceKm: 2.4 }, missingB];

    expect(compareRecommendationDistance(missingA, missingB)).toBe(0);
    expect(
      Number.isNaN(compareRecommendationDistance(missingA, missingB)),
    ).toBe(false);
    expect(
      candidates.sort(compareRecommendationDistance).map(({ id }) => id),
    ).toEqual(["known", "missing-a", "missing-b"]);
  });
});
