export const ROUTES = {
  HOME: "/",
  RECOVERY_SIMPLE: "/recovery/simple",
  RECOVERY_SIMPLE_SETUP: "/recovery/simple/setup",
  RECOVERY_SIMPLE_INFO: "/recovery/simple/info",
  RECOVERY_SIMPLE_RECOMMEND: "/recovery/simple/recommend",
  RECOVERY_SIMPLE_PLACE_DETAIL: (placeId: string) =>
    `/recovery/simple/recommend/place/${encodeURIComponent(placeId)}`,
  RECOVERY_DETAIL: "/recovery/detail",
} as const;
