import {
  Clock as ClockIcon,
  MapPin,
  ParkingCircle,
  Sparkles,
} from "lucide-react";

import { PlaceRating } from "@/shared/components/ui/PlaceRating";
import { Button } from "@/shared/components/ui/Button";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Tag } from "@/shared/components/ui/Tag";
import { useTravelMinutesLabel } from "../../hooks/useTravelMinutesLabel";
import { formatDistanceKm } from "../../lib/travelInfo";
import {
  TRANSPORT_LABEL,
  TRANSPORT_ORDER,
  TRAVEL_ICON_BY_MODE,
} from "../../lib/transportOptions";
import type { ResultRecommendation } from "../../mocks/resultEditMock";
import type { TransportMode } from "../../mocks/scheduleMock";

/**
 * 우측 상단 "추천 BEST" 상세 패널. AI 추천 이유, 이동/주차/운영시간 정보,
 * 상세보기/선택하기 액션으로 구성된다.
 */
export interface RecommendationDetailPanelProps {
  recommendation: ResultRecommendation;
  /** 지금 "이동 시간"을 보여줄 기준 이동수단 — 왼쪽 DAY 목록의 "다음 일정
   * 이동수단"과는 별개의 값이다(추천 카드 전용 미리보기). */
  transport: TransportMode;
  onTransportChange: (mode: TransportMode) => void;
  /** 교체 대상(원래 장소) 좌표 — "이동 시간"의 기준점. 대중교통이면 이 좌표로
   * 오디세이 실시간 조회를 한다. */
  origin: { lat: number; lng: number } | null;
  /** 지금 이 후보가 실제로 적용된 상태인지 — "선택완료"로 바꾸고 버튼을 비활성화한다. */
  selected?: boolean;
  onDetail?: () => void;
  onSelect?: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof ClockIcon;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-neutral-700">
      <Icon className="size-4 text-neutral-600" aria-hidden="true" />
      <span>{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
      {suffix && (
        <Tag variant="mint" size="sm" className="ml-1 border-0">
          {suffix}
        </Tag>
      )}
    </div>
  );
}

export function RecommendationDetailPanel({
  recommendation,
  transport,
  onTransportChange,
  origin,
  selected = false,
  onDetail,
  onSelect,
}: RecommendationDetailPanelProps) {
  const travelMinutesLabel = useTravelMinutesLabel(
    origin,
    { lat: recommendation.lat, lng: recommendation.lng },
    recommendation.distanceKm,
    transport,
  );

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-lg lg:max-h-[640px]">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
          <PlaceImage
            imageUrl={recommendation.imageUrl}
            imageAlt={recommendation.imageAlt}
            sizes="(max-width: 1024px) 100vw, 600px"
          />
          {recommendation.isAiRecommended && (
            <Tag
              variant="gray"
              appearance="solid"
              size="sm"
              className="absolute top-3 left-3"
            >
              추천 BEST
            </Tag>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-neutral-900">
              {recommendation.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              <PlaceRating value={recommendation.rating} />
              {recommendation.reviewCount !== undefined && (
                <span className="text-xs text-neutral-600">
                  ({recommendation.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-neutral-700">
            {recommendation.category}
          </p>
        </div>

        {recommendation.isAiRecommended &&
          recommendation.reasons &&
          recommendation.reasons.length > 0 && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                <Sparkles className="size-4" aria-hidden="true" />
                AI 추천 이유
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {recommendation.reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-2 text-sm text-neutral-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1 shrink-0 rounded-full bg-primary-500"
                    />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

        <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
          <span className="text-sm text-neutral-600">이동수단</span>
          <div className="flex items-center gap-1">
            {TRANSPORT_ORDER.map((mode) => {
              const isSelected = transport === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onTransportChange(mode)}
                  aria-pressed={isSelected}
                  aria-label={TRANSPORT_LABEL[mode]}
                  className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {TRANSPORT_LABEL[mode]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <InfoRow
            icon={TRAVEL_ICON_BY_MODE[transport]}
            label="이동 시간"
            value={travelMinutesLabel}
          />
          <InfoRow
            icon={MapPin}
            label="거리"
            value={formatDistanceKm(recommendation.distanceKm)}
          />
          <InfoRow
            icon={ParkingCircle}
            label="주차"
            value={recommendation.parkingLabel ?? "제공없음"}
          />
          <InfoRow
            icon={ClockIcon}
            label="운영 시간"
            value={recommendation.hoursLabel}
            suffix={recommendation.isOpenNow ? "영업중" : undefined}
          />
        </div>
      </div>

      <div className="flex shrink-0 gap-2 p-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onDetail}
        >
          상세보기
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={selected}
          onClick={onSelect}
        >
          {selected ? "선택완료" : "선택하기"}
        </Button>
      </div>
    </div>
  );
}
