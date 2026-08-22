import { useQuery } from "@tanstack/react-query";
import { fetchWeather } from "./weather";

export const weatherKeys = {
  all: ["weather"] as const,
  point: (lat: number, lng: number) => [...weatherKeys.all, lat, lng] as const,
};

/** lat/lng이 없으면(그 DAY에 좌표를 가진 일정이 없으면) 조회하지 않는다. */
export function useWeatherQuery(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: weatherKeys.point(lat ?? 0, lng ?? 0),
    queryFn: () => fetchWeather(lat as number, lng as number),
    enabled: lat != null && lng != null,
    staleTime: 10 * 60 * 1000,
  });
}
