import { fetchClient } from "@/shared/lib/api/fetchClient";

/**
 * REQ-WEATHER-001 (GET /api/v1/weather) 타입. docs/api/api-spec.md 참고.
 * 이 엔드포인트는 실패해도 HTTP 200을 내려주고 success:false로 구분한다.
 */
export type SkyCondition =
  | "CLEAR"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "RAIN"
  | "RAIN_SNOW"
  | "SNOW"
  | "SHOWER";

interface WeatherDataDto {
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation_probability: number;
  sky_condition: SkyCondition;
  /** "HHMM" 형식의 예보 기준 시각. */
  forecast_time: string;
}

type WeatherResponseDto =
  | { success: true; data: WeatherDataDto }
  | { success: false; error: { code: string; message: string } };

/** WeatherDetailPopover 등 UI가 실제로 쓰는 도메인 모델. */
export interface Weather {
  temperature: number;
  humidity: number;
  windSpeedMs: number;
  precipitationProbability: number;
  skyCondition: SkyCondition;
  /** "HH:MM" 형식으로 보기 좋게 변환한 예보 기준 시각. */
  forecastTime: string;
}

function toWeather(dto: WeatherDataDto): Weather {
  const hh = dto.forecast_time.slice(0, 2);
  const mm = dto.forecast_time.slice(2, 4);
  return {
    temperature: dto.temperature,
    humidity: dto.humidity,
    windSpeedMs: dto.wind_speed,
    precipitationProbability: dto.precipitation_probability,
    skyCondition: dto.sky_condition,
    forecastTime: `${hh}:${mm}`,
  };
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const data = await fetchClient<WeatherResponseDto>("/api/v1/weather", {
    params: { lat, lng },
  });

  if (!data.success) {
    throw new Error(data.error.message);
  }
  return toWeather(data.data);
}
