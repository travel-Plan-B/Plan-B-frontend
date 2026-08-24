"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Map,
  type MapMarkerData,
  type MapRouteData,
} from "@/shared/components/ui/Map/Map";
import { cn } from "@/shared/lib/cn";
import { computeTravelInfo } from "../../lib/travelInfo";
import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import type {
  ScheduleDay,
  ScheduleItem,
  TransportMode,
} from "../../mocks/scheduleMock";

type ScheduleItemWithCoords = ScheduleItem & { lat: number; lng: number };

/** design-system.md Tag 색상 팔레트와 맞춘 카테고리별 마커 색상. */
const CATEGORY_PIN_COLOR: Record<
  ReturnType<typeof getCategoryTagVariant>,
  string
> = {
  purple: "#8b5cf6",
  pink: "#ff4d8d",
  orange: "#fd7e14",
  mint: "#00c0ab",
  gray: "#495057",
};

/** TravelInfoRow의 이동수단별 색상(purple/rose/yellow)과 맞춘 경로선 색상. */
const TRANSPORT_ROUTE_COLOR: Record<TransportMode, string> = {
  car: "#887edb",
  walk: "#fc608f",
  transit: "#fdb118",
};

const LEGEND_CATEGORIES = [
  { label: "관광지", color: CATEGORY_PIN_COLOR.purple },
  { label: "음식점", color: CATEGORY_PIN_COLOR.pink },
  { label: "카페", color: CATEGORY_PIN_COLOR.orange },
];

const LEGEND_TRANSPORTS: { label: string; mode: TransportMode }[] = [
  { label: "자동차 이동", mode: "car" },
  { label: "대중교통 이동", mode: "transit" },
  { label: "도보 이동", mode: "walk" },
];

export interface ScheduleMapPanelProps {
  days: ScheduleDay[];
}

/**
 * "지도" 뷰. ScheduleInputPanel과 같은 자리(오른쪽 패널)에 들어가는 카드로,
 * 상단에 DAY 선택 + 범례를 지도 위에 얹고, 선택된 DAY의 일정 항목을 마커로,
 * 인접한 두 항목 사이 이동 경로를 이동수단별 색/스타일의 선으로 그린다.
 */
export function ScheduleMapPanel({ days }: ScheduleMapPanelProps) {
  const [activeDay, setActiveDay] = useState(1);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const dayMenuRef = useRef<HTMLDivElement>(null);

  const currentDay = days.find((day) => day.day === activeDay) ?? days[0];

  useEffect(() => {
    if (!dayMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!dayMenuRef.current?.contains(event.target as Node)) {
        setDayMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dayMenuOpen]);

  // 좌표가 없는 항목은 지도에 표시할 수 없어서, 마커/경로 둘 다 이 필터링된
  // 목록 하나를 공유한다 — 조건을 두 곳에 따로 두면 나중에 어긋나기 쉽다.
  const itemsWithCoords = useMemo<ScheduleItemWithCoords[]>(() => {
    if (!currentDay) return [];
    return currentDay.items.filter(
      (item): item is ScheduleItemWithCoords =>
        item.lat != null && item.lng != null,
    );
  }, [currentDay]);

  const markers = useMemo<MapMarkerData[]>(
    () =>
      itemsWithCoords.map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        title: item.placeName,
        description: item.visitTime,
        color: CATEGORY_PIN_COLOR[getCategoryTagVariant(item.categoryTag)],
      })),
    [itemsWithCoords],
  );

  // 경로는 itemsWithCoords(좌표 있는 것만 압축한 목록)가 아니라 원래 방문
  // 순서(currentDay.items)를 그대로 훑는다 — 압축된 목록을 쓰면 좌표 없는
  // 항목을 건너뛰고 그 앞뒤를 직접 연결하게 되어, 실제로는 없는 구간을
  // 그 사이 항목의 이동수단/예상시간으로 잘못 그리게 된다. 인접한 두 항목이
  // "둘 다" 좌표를 가질 때만 그 구간을 그린다.
  const routes = useMemo<MapRouteData[]>(() => {
    if (!currentDay) return [];
    const segments: MapRouteData[] = [];
    const { items } = currentDay;
    for (let i = 0; i < items.length - 1; i += 1) {
      const from = items[i];
      const to = items[i + 1];
      if (!from || !to) continue;
      if (from.lat == null || from.lng == null) continue;
      if (to.lat == null || to.lng == null) continue;

      const travelInfo = computeTravelInfo(from, to, from.transport);
      segments.push({
        id: `${from.id}-${to.id}`,
        path: [
          { lat: from.lat, lng: from.lng },
          { lat: to.lat, lng: to.lng },
        ],
        color: TRANSPORT_ROUTE_COLOR[from.transport],
        dashed: from.transport !== "car",
        label: `${travelInfo.estimatedMinutes}분`,
      });
    }
    return segments;
  }, [currentDay]);

  if (days.length === 0) {
    return (
      <Map
        markers={[]}
        className="rounded-2xl border border-neutral-200 shadow-lg"
      />
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
      <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
        <div ref={dayMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setDayMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-md"
          >
            DAY {currentDay?.day}
            <ChevronDown className="size-3.5 text-neutral-500" />
          </button>
          {dayMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-24 overflow-hidden rounded-xl bg-white py-1 shadow-lg">
              {days.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => {
                    setActiveDay(day.day);
                    setDayMenuOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-50",
                    day.day === currentDay?.day
                      ? "font-semibold text-primary-600"
                      : "text-neutral-700",
                  )}
                >
                  DAY {day.day}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-44 flex-col gap-2 rounded-xl bg-white px-3 py-2.5 text-tiny shadow-md">
          <div className="flex items-center gap-2">
            {LEGEND_CATEGORIES.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
          <div className="h-px w-full bg-neutral-100" />
          <div className="flex flex-col gap-1.5">
            {LEGEND_TRANSPORTS.map(({ label, mode }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: TRANSPORT_ROUTE_COLOR[mode] }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Map markers={markers} routes={routes} className="flex-1" />
    </div>
  );
}
