import { Cloud, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
import type { SkyCondition } from "../../api/weather";

export const SKY_ICONS: Record<SkyCondition, typeof Sun> = {
  CLEAR: Sun,
  PARTLY_CLOUDY: CloudSun,
  CLOUDY: Cloud,
  RAIN: CloudRain,
  RAIN_SNOW: CloudSnow,
  SNOW: CloudSnow,
  SHOWER: CloudRain,
};

// 상태별로 다른 색을 줘서(해=노랑, 비/눈=Primary 계열) 아이콘이 밋밋해 보이지 않게 한다.
export const SKY_ICON_COLORS: Record<SkyCondition, string> = {
  CLEAR: "text-yellow-500",
  PARTLY_CLOUDY: "text-yellow-500",
  CLOUDY: "text-neutral-400",
  RAIN: "text-primary-500",
  RAIN_SNOW: "text-primary-400",
  SNOW: "text-primary-300",
  SHOWER: "text-primary-600",
};

export const SKY_LABELS: Record<SkyCondition, string> = {
  CLEAR: "맑음",
  PARTLY_CLOUDY: "구름 조금",
  CLOUDY: "흐림",
  RAIN: "비",
  RAIN_SNOW: "비/눈",
  SNOW: "눈",
  SHOWER: "소나기",
};
