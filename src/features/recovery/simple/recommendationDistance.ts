export interface RecommendationDistance {
  distanceKm: number | null;
}

/** 좌표를 얻지 못한 후보는 뒤로 보내고, 둘 다 없으면 기존 순서를 유지한다. */
export function compareRecommendationDistance(
  a: RecommendationDistance,
  b: RecommendationDistance,
): number {
  if (a.distanceKm == null) return b.distanceKm == null ? 0 : 1;
  if (b.distanceKm == null) return -1;
  return a.distanceKm - b.distanceKm;
}
