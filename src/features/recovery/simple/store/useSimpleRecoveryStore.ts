import { create } from "zustand";

import type { SelectedDestination } from "../DestinationSearch";
import type { TransportType } from "../TransportSelector";
import type { SimpleRecommendationResponse } from "../api/simpleRecommendations";

export type RecoveryReason = "weather" | "closed" | "delay";

export interface CurrentLocation {
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface SimpleRecoveryInfo {
  currentLocationInput: string;
  currentLocation: CurrentLocation | null;
  destinationQuery: string;
  selectedDestination: SelectedDestination | null;
  arrivalTime: string;
  transport: TransportType | null;
}

export const INITIAL_SIMPLE_RECOVERY_INFO: SimpleRecoveryInfo = {
  currentLocationInput: "",
  currentLocation: null,
  destinationQuery: "",
  selectedDestination: null,
  arrivalTime: "",
  transport: null,
};

interface SimpleRecoveryStore {
  reason: RecoveryReason | null;
  info: SimpleRecoveryInfo;
  recommendationResponse: SimpleRecommendationResponse | null;
  setReason: (reason: RecoveryReason) => void;
  setInfo: (
    update:
      | SimpleRecoveryInfo
      | ((current: SimpleRecoveryInfo) => SimpleRecoveryInfo),
  ) => void;
  setRecommendationResponse: (
    response: SimpleRecommendationResponse | null,
  ) => void;
}

export const useSimpleRecoveryStore = create<SimpleRecoveryStore>()((set) => ({
  reason: null,
  info: INITIAL_SIMPLE_RECOVERY_INFO,
  recommendationResponse: null,
  setReason: (reason) => set({ reason }),
  setInfo: (update) =>
    set((state) => ({
      info: typeof update === "function" ? update(state.info) : update,
    })),
  setRecommendationResponse: (recommendationResponse) =>
    set({ recommendationResponse }),
}));
