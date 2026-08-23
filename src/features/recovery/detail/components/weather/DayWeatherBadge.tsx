"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { toast } from "@/shared/components/ui/Toast/toast";
import { useAnchoredPosition } from "@/shared/hooks/useAnchoredPosition";
import { useWeatherQuery } from "../../api/weatherQueries";
import { SKY_ICONS, SKY_LABELS } from "./weatherIcons";
import { WeatherDetailPopover } from "./WeatherDetailPopover";

export interface DayWeatherBadgeProps {
  /** 그 DAY의 날씨를 대표할 좌표(보통 첫 일정 항목). 없으면 아이콘만 흐리게 보여준다. */
  lat: number | null;
  lng: number | null;
}

/**
 * DAY 탭에 들어가는 날씨 아이콘. 호버 또는 클릭하면 기상청 API 상세 정보 팝오버(WeatherDetailPopover)가 뜬다.
 * 좌표는 그 DAY의 첫 일정 항목 위치를 쓴다 — 일정이 하나도 없으면 조회하지 않는다.
 */
export function DayWeatherBadge({ lat, lng }: DayWeatherBadgeProps) {
  // 호버로 뜬 상태(hovering)와 클릭으로 고정한 상태(pinned)를 나눈다 — 클릭해서 띄운
  // 뒤에는 마우스가 아이콘을 벗어나도(mouseleave) 안 닫혀야 "클릭해도 보인다"가 된다.
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovering || pinned;
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStyle = useAnchoredPosition(open, triggerRef, panelRef);

  // 고정된 상태에서 바깥을 클릭하면 닫는다.
  useEffect(() => {
    if (!pinned) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pinned]);

  const {
    data: weather,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useWeatherQuery(lat, lng);

  if (lat == null || lng == null) {
    // DAY 탭(TabsTrigger)이 이미 <button>이라 그 안에 또 <button>을 두면
    // 잘못된 HTML 중첩(button 안에 button)이 되어 hydration 에러가 난다 — span+role="button"으로 대체.
    return (
      <span
        role="button"
        tabIndex={0}
        title="일정 추가 후 날씨 확인 가능"
        onClick={(event) => {
          event.stopPropagation();
          toast.info("일정 추가 후 날씨를 볼 수 있어요.");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          toast.info("일정 추가 후 날씨를 볼 수 있어요.");
        }}
        aria-label="날씨 상세 정보 (일정 필요)"
        className="inline-flex cursor-help"
      >
        <span
          className="block size-6 rounded-full bg-neutral-100"
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={(event) => {
          // DAY 탭 버튼 안에 있어서, 클릭이 탭 전환으로 새지 않게 막는다.
          event.stopPropagation();
          setPinned((prev) => !prev);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          setPinned((prev) => !prev);
        }}
        aria-label="날씨 상세 정보"
        className="inline-flex cursor-pointer"
      >
        {weather ? (
          // 구름 계열 아이콘이 옅은 하늘색이라 흰 배경 탭 위에서는 거의 안 보인다 —
          // 배경을 깔지 않고 드롭섀도우로만 살짝 띄운다.
          // eslint-disable-next-line @next/next/no-img-element -- 작은 아이콘 SVG라 next/image 최적화가 불필요하고, SVG를 next/image로 쓰려면 next.config에 dangerouslyAllowSVG가 필요해 보안 표면만 넓어진다.
          <img
            src={SKY_ICONS[weather.skyCondition].src}
            alt={SKY_LABELS[weather.skyCondition]}
            className="size-6 drop-shadow-md"
          />
        ) : (
          // 로딩 중에는 (이전처럼) 다른 날씨 아이콘을 먼저 보여줬다가 실제 아이콘으로
          // 바뀌면 "아이콘이 갑자기 바뀐다"는 인상을 주므로, 아이콘 대신 스켈레톤을 보여준다.
          <span
            className="block size-6 animate-pulse rounded-full bg-neutral-200"
            aria-hidden="true"
          />
        )}
      </span>

      {open &&
        createPortal(
          <WeatherDetailPopover
            panelRef={panelRef}
            style={panelStyle}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            weather={weather}
            isLoading={isLoading}
            isError={isError}
            isFetching={isFetching}
            onRefetch={refetch}
          />,
          document.body,
        )}
    </>
  );
}
