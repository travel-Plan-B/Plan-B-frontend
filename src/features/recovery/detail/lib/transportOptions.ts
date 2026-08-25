import { Bus, Car, Footprints } from "lucide-react";

import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import type { TransportMode } from "../mocks/scheduleMock";

export const TRANSPORT_ORDER: TransportMode[] = ["walk", "car", "transit"];

export const TRANSPORT_ICONS: Record<TransportMode, typeof carIcon> = {
  car: carIcon,
  walk: walkIcon,
  transit: trainIcon,
};

export const TRANSPORT_LABEL: Record<TransportMode, string> = {
  car: "자동차",
  walk: "도보",
  transit: "대중교통",
};

/** lucide 아이콘 버전 — "이동 시간" 표시에 쓴다(실제 선택된 이동수단과
 * 아이콘이 안 맞으면 헷갈린다는 피드백을 받아서, 항상 이 맵으로 맞춘다). */
export const TRAVEL_ICON_BY_MODE: Record<TransportMode, typeof Car> = {
  car: Car,
  walk: Footprints,
  transit: Bus,
};
