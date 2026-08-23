import type { StaticImageData } from "next/image";
import type { SkyCondition } from "../../api/weather";
// Meteocons(MIT, https://meteocons.com)의 fill 스타일 아이콘을 여기로 복사해서 쓴다.
// 패키지 자체(node_modules)에서 바로 import하면 Turbopack이 정적 asset으로 인식하지
// 못해 <img src>가 빈 값이 되는 문제가 있어, 로컬 asset으로 옮겨서 우회한다.
// SKY_ICONS(날씨 상태)는 @meteocons/svg(애니메이션 SVG) — 크게 보여줘서 움직임이 자연스럽다.
// WEATHER_STAT_ICONS(기온/습도/바람/강수확률)는 @meteocons/svg-static — 작은 크기로 반복
// 재생되면 깨져 보여서 애니메이션 없는 정적 버전을 쓴다.
import cloudy from "@/shared/assets/icons/weather/cloudy.svg";
import clearDay from "@/shared/assets/icons/weather/clear-day.svg";
import humidity from "@/shared/assets/icons/weather/humidity.svg";
import overcastRain from "@/shared/assets/icons/weather/overcast-rain.svg";
import partlyCloudyDay from "@/shared/assets/icons/weather/partly-cloudy-day.svg";
import rain from "@/shared/assets/icons/weather/rain.svg";
import sleet from "@/shared/assets/icons/weather/sleet.svg";
import snow from "@/shared/assets/icons/weather/snow.svg";
import thermometer from "@/shared/assets/icons/weather/thermometer.svg";
import umbrella from "@/shared/assets/icons/weather/umbrella.svg";
import wind from "@/shared/assets/icons/weather/wind.svg";

export const SKY_ICONS: Record<SkyCondition, StaticImageData> = {
  CLEAR: clearDay,
  PARTLY_CLOUDY: partlyCloudyDay,
  CLOUDY: cloudy,
  RAIN: rain,
  RAIN_SNOW: sleet,
  SNOW: snow,
  SHOWER: overcastRain,
};

/** WeatherDetailPopover의 기온/습도/바람/강수확률 통계 아이콘. */
export const WEATHER_STAT_ICONS = {
  temperature: thermometer,
  humidity,
  wind,
  precipitation: umbrella,
} satisfies Record<string, StaticImageData>;

export const SKY_LABELS: Record<SkyCondition, string> = {
  CLEAR: "맑음",
  PARTLY_CLOUDY: "구름 조금",
  CLOUDY: "흐림",
  RAIN: "비",
  RAIN_SNOW: "비/눈",
  SNOW: "눈",
  SHOWER: "소나기",
};
