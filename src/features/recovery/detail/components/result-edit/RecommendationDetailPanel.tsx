import { Car, Clock as ClockIcon, ParkingCircle, Sparkles } from "lucide-react";

import { PlaceRating } from "@/features/recommendation/components/PlaceCard";
import { Button } from "@/shared/components/ui/Button";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Tag } from "@/shared/components/ui/Tag";
import type { ResultRecommendation } from "../../mocks/resultEditMock";

/**
 * 우측 상단 "추천 BEST" 상세 패널. AI 추천 이유, 이동/주차/운영시간 정보,
 * 상세보기/선택하기 액션으로 구성된다.
 */
export interface RecommendationDetailPanelProps {
  recommendation: ResultRecommendation;
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
  onDetail,
  onSelect,
}: RecommendationDetailPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
        <PlaceImage
          imageUrl={recommendation.imageUrl}
          imageAlt={recommendation.imageAlt}
          sizes="(max-width: 1024px) 100vw, 600px"
        />
        <Tag
          variant="gray"
          appearance="solid"
          size="sm"
          className="absolute top-3 left-3"
        >
          추천 BEST
        </Tag>
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

      {recommendation.reasons && recommendation.reasons.length > 0 && (
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-200 pt-3">
        <InfoRow
          icon={Car}
          label="이동 시간"
          value={recommendation.travelMinutesLabel}
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

      <div className="flex gap-2">
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
          onClick={onSelect}
        >
          선택하기
        </Button>
      </div>
    </div>
  );
}
