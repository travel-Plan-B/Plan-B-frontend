import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/shared/lib/api/fetchClient";
import { checkPairConflict } from "./scheduleConflicts";
import type { ScheduleItem } from "../mocks/scheduleMock";

// 캐싱/중복호출 방지는 TanStack Query(useDayConflicts의 useQueries)가 맡아서
// (#135) 여기서는 checkPairConflict가 백엔드 응답을 올바르게 해석하는지만
// 검증한다. 캐시 동작 자체는 라이브러리 책임이라 다시 테스트하지 않는다.
vi.mock("@/shared/lib/api/fetchClient", () => ({
  fetchClient: vi.fn(),
}));

const mockedFetchClient = vi.mocked(fetchClient);

function buildItem(overrides: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: "item-1",
    time: "09:00",
    placeName: "성산일출봉",
    categoryTag: "관광",
    visitTime: "09:00",
    stayDuration: "1시간",
    transport: "car",
    lat: 33.4581,
    lng: 126.9426,
    ...overrides,
  };
}

describe("checkPairConflict", () => {
  beforeEach(() => {
    mockedFetchClient.mockReset();
  });

  it("좌표가 없는 항목은 API를 부르지 않고 충돌 없음으로 본다", async () => {
    const item = buildItem({ lat: undefined, lng: undefined });
    const next = buildItem({ id: "item-2" });

    const result = await checkPairConflict(item, next);

    expect(result).toBeNull();
    expect(mockedFetchClient).not.toHaveBeenCalled();
  });

  it("valid: true면 충돌 없음(null)을 반환한다", async () => {
    mockedFetchClient.mockResolvedValue({
      success: true,
      data: {
        valid: true,
        buffer_minutes_remaining: 10,
        reason: null,
        shortfall_minutes: null,
      },
    });

    const result = await checkPairConflict(
      buildItem(),
      buildItem({ id: "item-2" }),
    );

    expect(result).toBeNull();
  });

  it("valid: false면 itemId와 shortfallMinutes를 담은 충돌을 반환한다", async () => {
    mockedFetchClient.mockResolvedValue({
      success: true,
      data: {
        valid: false,
        buffer_minutes_remaining: null,
        reason: "부족",
        shortfall_minutes: 15,
      },
    });

    const result = await checkPairConflict(
      buildItem({ id: "item-1" }),
      buildItem({ id: "item-2" }),
    );

    expect(result).toEqual({ itemId: "item-1", shortfallMinutes: 15 });
  });

  it("API 호출이 실패해도 충돌 없음(null)으로 취급한다(오탐 방지)", async () => {
    mockedFetchClient.mockRejectedValue(new Error("network error"));

    const result = await checkPairConflict(
      buildItem(),
      buildItem({ id: "item-2" }),
    );

    expect(result).toBeNull();
  });
});
