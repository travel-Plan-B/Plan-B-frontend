import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Place } from "../api/types";

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
        const isStored = get().storedPlaces.some((p) => p.id === place.id);
        set({
          storedPlaces: isStored
            ? get().storedPlaces.filter((p) => p.id !== place.id)
            : [...get().storedPlaces, place],
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
