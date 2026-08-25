import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Place } from "@/features/recovery/api/places";
import { toast } from "@/shared/components/ui/Toast/toast";

/** PlaceFinderPanel 안내 문구("보관함은 최대 N개까지")도 이 값을 그대로 쓴다. */
export const MAX_STORED_PLACES = 50;

interface StoredPlacesStore {
  storedPlaces: Place[];
  toggleStored: (place: Place) => void;
  removeStored: (id: string) => void;
  clearStored: () => void;
  /** localStorage에서 값을 읽어오기 전(SSR 직후)엔 false. 하이드레이션 불일치 방지용. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

/** 장소 보관함을 localStorage에 저장해 새로고침해도 유지되게 한다. */
export const useStoredPlacesStore = create<StoredPlacesStore>()(
  persist(
    (set, get) => ({
      storedPlaces: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      toggleStored: (place) => {
        const current = get().storedPlaces;
        const isStored = current.some((p) => p.id === place.id);
        if (!isStored && current.length >= MAX_STORED_PLACES) {
          toast.error(
            `보관함은 최대 ${MAX_STORED_PLACES}개까지 담을 수 있어요.`,
          );
          return;
        }
        set({
          storedPlaces: isStored
            ? current.filter((p) => p.id !== place.id)
            : [...current, place],
        });
      },
      removeStored: (id) =>
        set((state) => ({
          storedPlaces: state.storedPlaces.filter((place) => place.id !== id),
        })),
      clearStored: () => set({ storedPlaces: [] }),
    }),
    {
      name: "planb-stored-places",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ storedPlaces }) => ({ storedPlaces }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
