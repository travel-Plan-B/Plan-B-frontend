"use client";

import { RefreshCw } from "lucide-react";
import type { CSSProperties, Ref } from "react";
import type { StaticImageData } from "next/image";

import { Spinner } from "@/shared/components/ui/Spinner";
import { cn } from "@/shared/lib/cn";
import { SKY_ICONS, SKY_LABELS, WEATHER_STAT_ICONS } from "./weatherIcons";
import type { Weather } from "../../api/weather";

interface WeatherStatRowProps {
  icon: StaticImageData;
  iconClassName: string;
  label: string;
  value: string;
}

/** 기온/습도/바람/강수확률 한 줄(아이콘 + 라벨 + 값). 4번 반복되던 마크업을 여기로 모았다. */
function WeatherStatRow({
  icon,
  iconClassName,
  label,
  value,
}: WeatherStatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-neutral-600">
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 아이콘 SVG라 next/image 최적화가 불필요하고, SVG를 next/image로 쓰려면 next.config에 dangerouslyAllowSVG가 필요해 보안 표면만 넓어진다. */}
        <img src={icon.src} alt="" className={iconClassName} />
        {label}
      </span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export interface WeatherDetailPopoverProps {
  panelRef: Ref<HTMLDivElement>;
  style: CSSProperties | undefined;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  weather: Weather | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRefetch: () => void;
}

/** DayWeatherBadge가 호버/클릭 시 띄우는 "현재 날씨 상세 정보" 팝오버 내용. */
export function WeatherDetailPopover({
  panelRef,
  style,
  onMouseEnter,
  onMouseLeave,
  weather,
  isLoading,
  isError,
  isFetching,
  onRefetch,
}: WeatherDetailPopoverProps) {
  return (
    <div
      ref={panelRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative z-50 w-60 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg"
    >
      {/* 트리거 아이콘과 시각적으로 연결되도록 말풍선 꼬리를 붙인다. */}
      <div
        className="absolute -top-1.5 left-4 size-3 rotate-45 rounded-tl-xs border-t border-l border-neutral-200 bg-white"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-neutral-900">
          현재 날씨 상세 정보
        </p>
        {weather && (
          <p className="text-tiny shrink-0 text-neutral-500">
            기상청 API {weather.forecastTime} 기준
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : isError || !weather ? (
        <p className="py-6 text-center text-xs text-neutral-500">
          날씨 정보를 가져올 수 없어요.
        </p>
      ) : (
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 작은 아이콘 SVG라 next/image 최적화가 불필요하고, SVG를 next/image로 쓰려면 next.config에 dangerouslyAllowSVG가 필요해 보안 표면만 넓어진다. */}
            <img
              src={SKY_ICONS[weather.skyCondition].src}
              alt={SKY_LABELS[weather.skyCondition]}
              className="size-14 drop-shadow-md"
            />
            <span className="text-xs font-semibold text-neutral-900">
              {SKY_LABELS[weather.skyCondition]}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 text-xs">
            <WeatherStatRow
              icon={WEATHER_STAT_ICONS.temperature}
              iconClassName="size-6"
              label="기온"
              value={`${weather.temperature}°C`}
            />
            <WeatherStatRow
              icon={WEATHER_STAT_ICONS.humidity}
              iconClassName="size-5"
              label="습도"
              value={`${weather.humidity}%`}
            />
            <WeatherStatRow
              icon={WEATHER_STAT_ICONS.wind}
              iconClassName="size-5"
              label="바람"
              value={`${weather.windSpeedMs}m/s`}
            />
            <WeatherStatRow
              icon={WEATHER_STAT_ICONS.precipitation}
              iconClassName="size-5"
              label="강수확률"
              value={`${weather.precipitationProbability}%`}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRefetch();
        }}
        disabled={isFetching}
        className="mt-2.5 flex w-full items-center justify-center gap-1 border-t border-neutral-100 pt-2.5 text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
      >
        <RefreshCw
          className={cn("size-3.5", isFetching && "animate-spin")}
          aria-hidden="true"
        />
        새로고침
      </button>
    </div>
  );
}
