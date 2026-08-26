export const ROUTES = {
  HOME: "/",
  RECOVERY_SIMPLE: "/recovery/simple",
  RECOVERY_SIMPLE_SETUP: "/recovery/simple/setup",
  RECOVERY_SIMPLE_INFO: "/recovery/simple/info",
  RECOVERY_SIMPLE_RECOMMEND: "/recovery/simple/recommend",
  RECOVERY_SIMPLE_PLACE_DETAIL: (placeId: string, source: string) =>
    `/recovery/simple/recommend/place/${encodeURIComponent(placeId)}?source=${encodeURIComponent(source)}`,
  RECOVERY_DETAIL: "/recovery/detail",
  RECOVERY_DETAIL_PLACE_DETAIL: (
    placeId: string,
    source: string,
    itemId?: string,
  ) =>
    `/recovery/detail/place/${encodeURIComponent(placeId)}?source=${encodeURIComponent(source)}${itemId ? `&itemId=${encodeURIComponent(itemId)}` : ""}`,
  RECOVERY_SHARE: "/recovery/share",
} as const;
