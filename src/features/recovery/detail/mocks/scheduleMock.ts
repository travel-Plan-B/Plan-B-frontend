/**
 * 여행 일정 타임라인(ScheduleInputPanel)용 타입 + 목업 데이터.
 * buildScheduleDays가 여행 기간으로 DAY 1..N을 만들고 MOCK_ITEMS_BY_DAY로 채운다.
 *
 * TODO(#73): 실제 일정 데이터 연결(드래그앤드롭).
 */
export type TransportMode = "car" | "walk" | "transit";

export interface ScheduleItem {
  id: string;
  time: string;
  placeName: string;
  categoryTag: string;
  visitTime: string;
  stayDuration: string;
  transport: TransportMode;
  travelInfo?: {
    mode: TransportMode;
    label: string;
    estimatedMinutes: number;
    distanceKm: number;
  };
}

export interface ScheduleDay {
  day: number;
  dateLabel: string;
  temperature: number;
  items: ScheduleItem[];
}

export const TRAVEL_INFO_BY_MODE: Record<
  TransportMode,
  { label: string; estimatedMinutes: number; distanceKm: number }
> = {
  car: { label: "자동차 이동", estimatedMinutes: 18, distanceKm: 11.2 },
  walk: { label: "도보 이동", estimatedMinutes: 18, distanceKm: 11.2 },
  transit: { label: "대중교통 이동", estimatedMinutes: 18, distanceKm: 11.2 },
};

function buildItem(
  id: string,
  time: string,
  placeName: string,
  categoryTag: string,
  transport: TransportMode,
  withTravelInfo = true,
): ScheduleItem {
  return {
    id,
    time,
    placeName,
    categoryTag,
    visitTime: time,
    stayDuration: "1시간 20분",
    transport,
    travelInfo: withTravelInfo
      ? { mode: transport, ...TRAVEL_INFO_BY_MODE[transport] }
      : undefined,
  };
}

export const MOCK_ITEMS_BY_DAY: Record<number, ScheduleItem[]> = {
  1: [
    buildItem("item-1", "09:00", "성산일출봉", "관광", "car"),
    buildItem("item-2", "11:00", "섭지코지", "관광", "walk"),
    buildItem("item-3", "13:30", "우진해장국", "음식점", "transit"),
    buildItem("item-4", "15:00", "카페 델문도", "카페", "car", false),
  ],
  2: [
    buildItem("item-5", "10:00", "아쿠아플라넷 제주", "관광", "car"),
    buildItem("item-6", "13:00", "카페 델문도", "카페", "walk", false),
  ],
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDayLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}(${WEEKDAYS[date.getDay()]})`;
}

export function buildScheduleDays(start: Date, end: Date): ScheduleDay[] {
  const days: ScheduleDay[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  let dayNumber = 1;
  while (cursor <= last) {
    days.push({
      day: dayNumber,
      dateLabel: formatDayLabel(cursor),
      temperature: 22,
      items: MOCK_ITEMS_BY_DAY[dayNumber] ?? [],
    });
    cursor.setDate(cursor.getDate() + 1);
    dayNumber += 1;
  }

  return days;
}
