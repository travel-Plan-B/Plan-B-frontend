import { beforeEach, describe, expect, it } from "vitest";

import type { SimpleRecommendationResponse } from "../api/simpleRecommendations";
import {
  INITIAL_SIMPLE_RECOVERY_INFO,
  useSimpleRecoveryStore,
} from "./useSimpleRecoveryStore";

const RESPONSE: SimpleRecommendationResponse = {
  success: true,
  data: {
    ai_recommended: [],
    more_places: [],
  },
};

const LOCATION = {
  kind: "search" as const,
  placeId: "place-a",
  providerSource: "kakao",
  name: "장소 A",
  address: "서울시 중구",
  lat: 37.5,
  lng: 127,
};

describe("simple recovery store lifecycle", () => {
  beforeEach(() => {
    useSimpleRecoveryStore.getState().reset();
  });

  it("추천 사유가 변경되면 이전 응답을 무효화한다", () => {
    const store = useSimpleRecoveryStore.getState();
    store.setReason("weather");
    store.setRecommendationResponse(RESPONSE);

    store.setReason("delay");

    expect(useSimpleRecoveryStore.getState().recommendationResponse).toBeNull();
  });

  it.each([
    ["장소", { referenceLocation: { ...LOCATION, placeId: "place-b" } }],
    [
      "장소 source",
      { referenceLocation: { ...LOCATION, providerSource: "tourapi" } },
    ],
    ["장소 이름", { referenceLocation: { ...LOCATION, name: "장소 B" } }],
    ["장소 위도", { referenceLocation: { ...LOCATION, lat: 37.6 } }],
    ["장소 경도", { referenceLocation: { ...LOCATION, lng: 127.1 } }],
    ["도착 시간", { arrivalTime: "16:00" }],
    ["이동수단", { transport: "transit" as const }],
  ])("%s 조건이 변경되면 이전 응답을 무효화한다", (_label, change) => {
    const store = useSimpleRecoveryStore.getState();
    store.setInfo({
      referenceLocationInput: LOCATION.name,
      referenceLocation: LOCATION,
      arrivalTime: "15:00",
      transport: "car",
    });
    useSimpleRecoveryStore.getState().setRecommendationResponse(RESPONSE);

    useSimpleRecoveryStore
      .getState()
      .setInfo((info) => ({ ...info, ...change }));

    expect(useSimpleRecoveryStore.getState().recommendationResponse).toBeNull();
  });

  it("API 요청과 무관한 입력 표시값만 바뀌면 응답을 유지한다", () => {
    const store = useSimpleRecoveryStore.getState();
    store.setRecommendationResponse(RESPONSE);

    store.setInfo((info) => ({
      ...info,
      referenceLocationInput: "표시용 검색어",
    }));

    expect(useSimpleRecoveryStore.getState().recommendationResponse).toBe(
      RESPONSE,
    );
  });

  it("API 요청과 무관한 주소만 바뀌면 응답을 유지한다", () => {
    const store = useSimpleRecoveryStore.getState();
    store.setInfo({
      referenceLocationInput: LOCATION.name,
      referenceLocation: LOCATION,
      arrivalTime: "15:00",
      transport: "car",
    });
    useSimpleRecoveryStore.getState().setRecommendationResponse(RESPONSE);

    useSimpleRecoveryStore.getState().setInfo((info) => ({
      ...info,
      referenceLocation: info.referenceLocation
        ? { ...info.referenceLocation, address: "표시용 새 주소" }
        : null,
    }));

    expect(useSimpleRecoveryStore.getState().recommendationResponse).toBe(
      RESPONSE,
    );
  });

  it("reset은 간편 복구 세션 전체를 초기 상태로 되돌린다", () => {
    const store = useSimpleRecoveryStore.getState();
    store.setReason("delay");
    store.setInfo({
      referenceLocationInput: LOCATION.name,
      referenceLocation: LOCATION,
      arrivalTime: "18:00",
      transport: "walk",
    });
    useSimpleRecoveryStore.getState().setRecommendationResponse(RESPONSE);

    useSimpleRecoveryStore.getState().reset();

    expect(useSimpleRecoveryStore.getState()).toMatchObject({
      reason: null,
      info: INITIAL_SIMPLE_RECOVERY_INFO,
      recommendationResponse: null,
    });
  });
});
