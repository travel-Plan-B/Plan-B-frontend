import { create } from "zustand";

import type { TransportType } from "../TransportSelector";
import type { SimpleRecommendationResponse } from "../api/simpleRecommendations";

export type RecoveryReason = "weather" | "closed" | "delay";

interface ReferenceLocationBase {
  address: string;
  lat: number;
  lng: number;
}

export type ReferenceLocation = ReferenceLocationBase & {
  kind: "search";
  placeId: string;
  providerSource: string;
  name: string;
};

export interface SimpleRecoveryInfo {
  referenceLocationInput: string;
  referenceLocation: ReferenceLocation | null;
  arrivalTime: string;
  transport: TransportType | null;
}

export const INITIAL_SIMPLE_RECOVERY_INFO: SimpleRecoveryInfo = {
  referenceLocationInput: "",
  referenceLocation: null,
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
