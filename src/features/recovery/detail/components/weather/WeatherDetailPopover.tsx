"use client";

import { Droplet, RefreshCw, Thermometer, Umbrella, Wind } from "lucide-react";
import type { CSSProperties, Ref } from "react";

import { Spinner } from "@/shared/components/ui/Spinner";
import { cn } from "@/shared/lib/cn";
import { SKY_LABELS } from "./weatherIcons";
import type { Weather } from "../../api/weather";

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
  Icon: typeof Thermometer;
  iconColor: string;
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
  Icon,
  iconColor,
}: WeatherDetailPopoverProps) {
  return (
    <div
      ref={panelRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-900">
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
        <div className="mt-3 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <Icon className={cn("size-10", iconColor)} aria-hidden="true" />
            <span className="text-sm font-semibold text-neutral-900">
              {SKY_LABELS[weather.skyCondition]}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-600">
                <Thermometer
                  className="size-3.5 text-rose-500"
                  aria-hidden="true"
                />
                기온
              </span>
              <span className="font-medium text-neutral-900">
                {weather.temperature}°C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-600">
                {/* design-system.md에 파랑 토큰이 없어 이 아이콘만 Tailwind 기본 blue-500을 예외적으로 사용 */}
                <Droplet
                  className="size-3.5 text-blue-500"
                  aria-hidden="true"
                />
                습도
              </span>
              <span className="font-medium text-neutral-900">
                {weather.humidity}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-600">
                <Wind
                  className="size-3.5 text-neutral-500"
                  aria-hidden="true"
                />
                바람
              </span>
              <span className="font-medium text-neutral-900">
                {weather.windSpeedMs}m/s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-600">
                <Umbrella
                  className="size-3.5 text-rose-500"
                  aria-hidden="true"
                />
                강수확률
              </span>
              <span className="font-medium text-neutral-900">
                {weather.precipitationProbability}%
              </span>
            </div>
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
        className="mt-3 flex w-full items-center justify-center gap-1 border-t border-neutral-100 pt-3 text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
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
