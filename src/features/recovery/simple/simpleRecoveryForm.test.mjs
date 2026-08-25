import assert from "node:assert/strict";
import test from "node:test";

import {
  isFutureArrivalTime,
  isLatestLocationSelection,
  isSimpleRecoveryInfoSubmittable,
  toGpsReferenceLocation,
  toMinutes,
  toSearchReferenceLocation,
  toSimpleRecoveryLocationDraft,
} from "./simpleRecoveryForm.ts";

const CURRENT_TIME = new Date(2026, 0, 1, 10, 0);
const GPS_LOCATION = {
  source: "gps",
  address: "인천광역시 연수구 선학로 101",
  lat: 37.4094,
  lng: 126.6782,
};
const SEARCH_LOCATION = {
  source: "search",
  name: "인천차이나타운",
  address: "인천광역시 중구 차이나타운로",
  lat: 37.4756,
  lng: 126.6179,
};
const COMPLETE_FORM = {
  referenceLocation: GPS_LOCATION,
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

test("기준 위치가 없으면 제출할 수 없다", () => {
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      referenceLocation: null,
    }),
    false,
  );
});

test("GPS 기준 위치와 필수값이 있으면 제출할 수 있다", () => {
  assert.equal(isSimpleRecoveryInfoSubmittable(COMPLETE_FORM), true);
});

test("검색 기준 위치와 필수값이 있으면 제출할 수 있다", () => {
  assert.equal(
    isSimpleRecoveryInfoSubmittable({
      ...COMPLETE_FORM,
      referenceLocation: SEARCH_LOCATION,
    }),
    true,
  );
});

test("GPS 위치를 검색 위치로 변경하면 검색 위치가 최종 기준 위치가 된다", () => {
  const selectedPlace = {
    id: "place-id",
    name: SEARCH_LOCATION.name,
    address: SEARCH_LOCATION.address,
    lat: SEARCH_LOCATION.lat,
    lng: SEARCH_LOCATION.lng,
  };

  assert.deepEqual(toSearchReferenceLocation(selectedPlace), SEARCH_LOCATION);
});

test("검색 위치를 GPS 위치로 변경하면 검색 제외 이름이 남지 않는다", () => {
  const gpsLocation = toGpsReferenceLocation(GPS_LOCATION.address, {
    lat: GPS_LOCATION.lat,
    lng: GPS_LOCATION.lng,
  });

  assert.deepEqual(gpsLocation, GPS_LOCATION);
  assert.deepEqual(toSimpleRecoveryLocationDraft(gpsLocation), {
    currentLocation: { lat: GPS_LOCATION.lat, lng: GPS_LOCATION.lng },
  });
});

test("검색 선택 이후 도착한 이전 GPS 응답은 최신 선택으로 인정하지 않는다", () => {
  const gpsRequestVersion = 1;
  const searchSelectionVersion = 2;

  assert.equal(
    isLatestLocationSelection(gpsRequestVersion, searchSelectionVersion),
    false,
  );
  assert.equal(
    isLatestLocationSelection(
      searchSelectionVersion,
      searchSelectionVersion,
    ),
    true,
  );
});

test("시간 또는 지원 이동수단이 없으면 제출할 수 없다", () => {
  for (const incomplete of [
    { arrivalTime: "" },
    { arrivalTime: "09:59" },
    { transport: null },
    { transport: "transit" },
  ]) {
    assert.equal(
      isSimpleRecoveryInfoSubmittable({ ...COMPLETE_FORM, ...incomplete }),
      false,
    );
  }
});

test("GPS 위치는 currentLocation만 포함하는 API draft를 만든다", () => {
  assert.deepEqual(toSimpleRecoveryLocationDraft(GPS_LOCATION), {
    currentLocation: { lat: GPS_LOCATION.lat, lng: GPS_LOCATION.lng },
  });
});

test("검색 위치는 currentLocation과 제외 이름을 포함하고 nextPlace는 만들지 않는다", () => {
  const draft = toSimpleRecoveryLocationDraft(SEARCH_LOCATION);

  assert.deepEqual(draft, {
    currentLocation: { lat: SEARCH_LOCATION.lat, lng: SEARCH_LOCATION.lng },
    excludePlaceName: SEARCH_LOCATION.name,
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
