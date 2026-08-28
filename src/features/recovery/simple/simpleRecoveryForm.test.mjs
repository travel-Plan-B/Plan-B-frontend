import assert from "node:assert/strict";
import test from "node:test";

import {
  isFutureArrivalTime,
  isSimpleRecoveryInfoSubmittable,
  toMinutes,
  toSearchReferenceLocation,
  toSimpleRecoveryLocationDraft,
} from "./simpleRecoveryForm.ts";

const CURRENT_TIME = new Date(2026, 0, 1, 10, 0);
const SEARCH_LOCATION = {
  kind: "search",
  placeId: "8199114",
  providerSource: "kakao",
  name: "인천차이나타운",
  address: "인천광역시 중구 차이나타운로",
  lat: 37.4756,
  lng: 126.6179,
};
const COMPLETE_FORM = {
  referenceLocation: SEARCH_LOCATION,
  arrivalTime: "15:00",
  transport: "car",
  currentTime: CURRENT_TIME,
};

test("HH:mm 시간을 분 단위로 변환한다", () => {
  assert.equal(toMinutes("17:30"), 1050);
  assert.equal(toMinutes("9:00"), 540);
  assert.equal(toMinutes("24:00"), null);
});

test("오늘 기준 현재 시간 이후의 도착 시간만 유효하다", () => {
  const currentTime = new Date(2026, 0, 1, 17, 0);

  assert.equal(isFutureArrivalTime("19:00", currentTime), true);
  assert.equal(isFutureArrivalTime("16:59", currentTime), false);
  assert.equal(isFutureArrivalTime("17:00", currentTime), false);
  assert.equal(
    isFutureArrivalTime("00:30", new Date(2026, 0, 1, 23, 0)),
    false,
  );
});

test("복구 대상 장소가 없으면 제출할 수 없다", () => {
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      referenceLocation: null,
    }),
    false,
  );
});

test("검색한 복구 대상 장소와 필수값이 있으면 제출할 수 있다", () => {
  assert.equal(isSimpleRecoveryInfoSubmittable(COMPLETE_FORM), true);
});

test("검색 결과 식별 정보를 복구 대상 장소에 보존한다", () => {
  const selectedPlace = {
    id: `${SEARCH_LOCATION.providerSource}:${SEARCH_LOCATION.placeId}`,
    placeId: SEARCH_LOCATION.placeId,
    source: SEARCH_LOCATION.providerSource,
    name: SEARCH_LOCATION.name,
    address: SEARCH_LOCATION.address,
    lat: SEARCH_LOCATION.lat,
    lng: SEARCH_LOCATION.lng,
  };

  assert.deepEqual(toSearchReferenceLocation(selectedPlace), SEARCH_LOCATION);
});

test("시간 또는 이동수단이 없으면 제출할 수 없다", () => {
  for (const incomplete of [
    { arrivalTime: "" },
    { arrivalTime: "09:59" },
    { transport: null },
  ]) {
    assert.equal(
      isSimpleRecoveryInfoSubmittable({ ...COMPLETE_FORM, ...incomplete }),
      false,
    );
  }
});

test("대중교통을 선택해도 제출할 수 있다", () => {
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      transport: "transit",
    }),
    true,
  );
});

test("복구 대상 장소는 식별 정보와 좌표를 draft에 보존한다", () => {
  const draft = toSimpleRecoveryLocationDraft(SEARCH_LOCATION);

  assert.deepEqual(draft, {
    currentLocation: { lat: SEARCH_LOCATION.lat, lng: SEARCH_LOCATION.lng },
    excludePlaceName: SEARCH_LOCATION.name,
    placeId: SEARCH_LOCATION.placeId,
    providerSource: SEARCH_LOCATION.providerSource,
  });
  assert.equal(draft !== null && "nextPlace" in draft, false);
});

test("제출 시점에 도착 시간이 지나면 다시 무효로 판단한다", () => {
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      arrivalTime: "17:00",
      currentTime: new Date(2026, 0, 1, 16, 59),
    }),
    true,
  );
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      arrivalTime: "17:00",
      currentTime: new Date(2026, 0, 1, 17, 0),
    }),
    false,
  );
});
