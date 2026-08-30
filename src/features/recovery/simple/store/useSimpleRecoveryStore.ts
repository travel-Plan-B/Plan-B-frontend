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

function hasRecommendationInputsChanged(
  current: SimpleRecoveryInfo,
  next: SimpleRecoveryInfo,
): boolean {
  const currentLocation = current.referenceLocation;
  const nextLocation = next.referenceLocation;
  const locationChanged =
    currentLocation === null || nextLocation === null
      ? currentLocation !== nextLocation
      : currentLocation.placeId !== nextLocation.placeId ||
        currentLocation.providerSource !== nextLocation.providerSource ||
        currentLocation.name !== nextLocation.name ||
        currentLocation.lat !== nextLocation.lat ||
        currentLocation.lng !== nextLocation.lng;

  return (
    locationChanged ||
    current.arrivalTime !== next.arrivalTime ||
    current.transport !== next.transport
  );
}

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
  resetRecommendation: () => void;
  reset: () => void;
}

export const useSimpleRecoveryStore = create<SimpleRecoveryStore>()((set) => ({
  reason: null,
  info: INITIAL_SIMPLE_RECOVERY_INFO,
  recommendationResponse: null,
  // 추천 사유는 API 요청 조건이므로 바뀌면 이전 응답을 재사용할 수 없다.
  setReason: (reason) =>
    set((state) => ({
      reason,
      recommendationResponse:
        state.reason === reason ? state.recommendationResponse : null,
    })),
  setInfo: (update) =>
    set((state) => {
      const info = typeof update === "function" ? update(state.info) : update;
      return {
        info,
        recommendationResponse: hasRecommendationInputsChanged(state.info, info)
          ? null
          : state.recommendationResponse,
      };
    }),
  setRecommendationResponse: (recommendationResponse) =>
    set({ recommendationResponse }),
  resetRecommendation: () => set({ recommendationResponse: null }),
  reset: () =>
    set({
      reason: null,
      info: { ...INITIAL_SIMPLE_RECOVERY_INFO },
      recommendationResponse: null,
    }),
}));
