import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchClient } from "@/shared/lib/api/fetchClient";
import { fetchTravelTime } from "./travelTime";

vi.mock("@/shared/lib/api/fetchClient", () => ({
  fetchClient: vi.fn(),
}));

const mockedFetchClient = vi.mocked(fetchClient);
const mockedFetch = vi.fn();

const ORIGIN = { lat: 37.5665, lng: 126.978 };
const DESTINATION = { lat: 37.4979, lng: 127.0276 };

describe("fetchTravelTime", () => {
  beforeEach(() => {
    mockedFetchClient.mockReset();
    mockedFetch.mockReset();
    vi.stubGlobal("fetch", mockedFetch);
  });

  it("car/walk는 백엔드 API 응답을 그대로 매핑한다(거리 포함)", async () => {
    mockedFetchClient.mockResolvedValue({
      success: true,
      data: {
        travel_minutes: 12,
        distance: "3km",
        distance_km: 3,
        estimated: false,
      },
    });

    const result = await fetchTravelTime(ORIGIN, DESTINATION, "car");

    expect(result).toEqual({ minutes: 12, distanceKm: 3 });
  });

  it("대중교통은 정상 응답이면 거리 없이(null) 이동시간만 반환한다", async () => {
    mockedFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({ result: { path: [{ info: { totalTime: 45 } }] } }),
    });

    const result = await fetchTravelTime(ORIGIN, DESTINATION, "transit");

    expect(result).toEqual({ minutes: 45, distanceKm: null });
  });

  it("대중교통은 '경로 없음' 에러 코드면 실패 없이 null을 반환한다", async () => {
    mockedFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({ error: [{ code: "-99", message: "검색결과 없음" }] }),
    });

    const result = await fetchTravelTime(ORIGIN, DESTINATION, "transit");

    expect(result).toBeNull();
  });

  it("대중교통은 그 외 에러 코드(인증 실패 등)면 throw해서 TanStack Query가 isError로 잡게 한다", async () => {
    mockedFetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          error: [{ code: "500", message: "서버 내부 오류" }],
        }),
    });

    await expect(
      fetchTravelTime(ORIGIN, DESTINATION, "transit"),
    ).rejects.toThrow();
  });
});
