import type { PlaceSource } from "./placeDetail";

export interface RecommendationContext {
  placeId: string;
  source: PlaceSource;
  itemId?: string;
  previousPlaceName?: string;
  nextPlaceName?: string;
  travelTimeFromPrevMinutes?: number;
  estimatedDurationMinutes?: number;
  travelTimeToNextMinutes?: number;
  scheduleBufferMinutes?: number;
  recommendReasons?: string[];
}

const contexts = new Map<string, RecommendationContext>();

function getContextKey(placeId: string, source: PlaceSource, itemId?: string) {
  return [source, placeId, itemId ?? ""].join(":");
}

export function saveRecommendationContext(context: RecommendationContext) {
  contexts.set(
    getContextKey(context.placeId, context.source, context.itemId),
    context,
  );
}

export function getRecommendationContext(
  placeId: string,
  source: PlaceSource,
  itemId?: string,
) {
  return contexts.get(getContextKey(placeId, source, itemId));
}
