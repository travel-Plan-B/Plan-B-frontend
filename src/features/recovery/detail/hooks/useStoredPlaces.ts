import { useMemo, useState } from "react";
import type { Place } from "@/features/recovery/api/places";
import { useStoredPlacesStore } from "../store/useStoredPlacesStore";

const ALL_CATEGORY = "전체";
// 매 렌더마다 새 배열 참조가 생기지 않도록 하이드레이션 전 기본값을 고정해둔다.
const EMPTY_PLACES: Place[] = [];

/**
 * PlaceFinderPanel "장소 보관함" 탭 상태 관리.
 * 담긴 장소 자체는 zustand store(localStorage 저장)에서 가져오고,
 * 담기/빼기/비우기, 카테고리 필터는 이 훅에서 다룬다.
 */
export function useStoredPlaces() {
  const hasHydrated = useStoredPlacesStore((state) => state.hasHydrated);
  const persistedPlaces = useStoredPlacesStore((state) => state.storedPlaces);
  const toggleStored = useStoredPlacesStore((state) => state.toggleStored);
  const removeStored = useStoredPlacesStore((state) => state.removeStored);
  const clearStored = useStoredPlacesStore((state) => state.clearStored);
  // SSR과 zustand persist(localStorage) 하이드레이션이 어긋나는 걸 막기 위해
  // 하이드레이션 전에는 빈 목록으로 둔다.
  const storedPlaces = hasHydrated ? persistedPlaces : EMPTY_PLACES;

  const isStored = (id: string) =>
    storedPlaces.some((place) => place.id === id);

  // 필터 칩 목록: "전체" + 보관함에 실제로 담긴 장소들의 카테고리(중복 제거).
  const categories = useMemo(
    () => [
      ALL_CATEGORY,
      ...Array.from(new Set(storedPlaces.map((place) => place.categoryTag))),
    ],
    [storedPlaces],
  );

  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY);
  // 보관함 비우기 등으로 선택했던 카테고리가 사라지면 "전체"로 되돌린다.
  const activeCategoryFilter = categories.includes(categoryFilter)
    ? categoryFilter
    : ALL_CATEGORY;

  const filteredStoredPlaces =
    activeCategoryFilter === ALL_CATEGORY
      ? storedPlaces
      : storedPlaces.filter(
          (place) => place.categoryTag === activeCategoryFilter,
        );

  return {
    storedPlaces,
    isStored,
    toggleStored,
    removeStored,
    clearStored,
    categories,
    categoryFilter: activeCategoryFilter,
    setCategoryFilter,
    filteredStoredPlaces,
  };
}
