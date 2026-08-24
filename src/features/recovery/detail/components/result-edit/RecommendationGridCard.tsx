import { Clock, Footprints, ParkingCircle } from "lucide-react";

import { PlaceRating } from "@/features/recommendation/components/PlaceCard";
import { Button } from "@/shared/components/ui/Button";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Tag } from "@/shared/components/ui/Tag";
import type { ResultRecommendation } from "../../mocks/resultEditMock";

/**
 * "다른 추천 장소" 그리드 카드. 공용 PlaceCard(compact)는 라벨/아이콘이
 * Figma("이동 시간" + 도보 아이콘)와 달라 심플모드 화면에 영향을 주지 않도록
 * 결과편집 전용으로 새로 만든다.
 */
export interface RecommendationGridCardProps {
  place: ResultRecommendation;
  onDetail?: () => void;
  onSelect?: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-700">
      <Icon className="size-3.5 shrink-0 text-neutral-600" aria-hidden="true" />
      <span className="shrink-0">{label}</span>
      <span className="font-medium whitespace-nowrap text-neutral-900">
        {value}
      </span>
      {suffix && (
        <Tag
          variant="mint"
          size="sm"
          className="shrink-0 border-0 px-1.5 py-0.5 text-tiny leading-3"
        >
          {suffix}
        </Tag>
      )}
    </div>
  );
}

export function RecommendationGridCard({
  place,
  onDetail,
  onSelect,
}: RecommendationGridCardProps) {
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="relative aspect-video bg-neutral-100">
        <PlaceImage
          imageUrl={place.imageUrl}
          imageAlt={place.imageAlt}
          sizes="320px"
        />
        <Tag
          variant="purple"
          appearance="solid"
          size="sm"
          className="absolute top-3 left-3"
        >
          AI 추천
        </Tag>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 break-keep text-base font-semibold text-neutral-900">
              {place.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              <PlaceRating value={place.rating} />
              {place.reviewCount !== undefined && (
                <span className="text-xs text-neutral-600">
                  ({place.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 truncate text-sm text-neutral-700">
            {place.category}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-neutral-200 pt-3">
          <InfoRow
            icon={Footprints}
            label="이동 시간"
            value={place.travelMinutesLabel}
          />
          <InfoRow
            icon={Clock}
            label="운영 시간"
            value={place.hoursLabel}
            suffix={place.isOpenNow ? "영업중" : undefined}
          />
          <InfoRow
            icon={ParkingCircle}
            label="주차"
            value={place.parkingLabel ?? "제공없음"}
          />
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 flex-1 px-2 py-1.5 text-xs whitespace-nowrap"
            onClick={onDetail}
          >
            상세보기
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-0 flex-1 px-2 py-1.5 text-xs whitespace-nowrap"
            onClick={onSelect}
          >
            선택하기
          </Button>
        </div>
      </div>
    </article>
  );
}
