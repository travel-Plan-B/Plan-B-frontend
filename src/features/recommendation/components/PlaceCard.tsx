import type { HTMLAttributes, MouseEventHandler } from "react";
import { Clock, Footprints, MapPin, ParkingCircle } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { PlaceRating } from "@/shared/components/ui/PlaceRating";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";

export type PlaceCardVariant = "default" | "compact";

const variantStyles: Record<PlaceCardVariant, string> = {
  default: "min-w-0 max-w-full sm:min-w-72 sm:max-w-90",
  compact: "min-w-0 max-w-full sm:min-w-80 sm:max-w-90",
};

export interface PlaceCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  variant?: PlaceCardVariant;
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  category?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  travelTime?: string;
  /** compact 전용: "이동 시간" 아이콘 — 실제 선택된 이동수단과 맞춰야 해서
   * (예: 자동차인데 도보 아이콘이 뜨면 헷갈린다는 피드백) 호출부에서 넘긴다.
   * 안 넘기면 기존처럼 Footprints를 쓴다. */
  travelIcon?: typeof Clock;
  stayTime?: string;
  cost?: string;
  distance?: string;
  hours?: string;
  parking?: string;
  recommended?: boolean;
  /** compact 전용: 이미 적용된 후보면 "선택완료"로 바꾸고 버튼을 비활성화한다. */
  selected?: boolean;
  onDetail?: MouseEventHandler<HTMLButtonElement>;
  onSelect?: MouseEventHandler<HTMLButtonElement>;
}

interface InfoRowProps {
  label: string;
  value: string;
  icon?: typeof Clock;
  compact?: boolean;
}

function InfoRow({ label, value, icon: Icon, compact = false }: InfoRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-2 text-sm sm:gap-3",
        compact ? "items-start" : "items-center justify-between",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center gap-2 text-neutral-700",
          "whitespace-nowrap",
          compact && "w-20",
        )}
      >
        {Icon && <Icon aria-hidden="true" className="size-4" />}
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 break-words font-medium text-neutral-900",
          compact ? "line-clamp-2 flex-1" : "text-right",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PlaceCard({
  variant = "default",
  imageUrl,
  imageAlt,
  title,
  category,
  location,
  rating,
  reviewCount,
  travelTime,
  travelIcon = Footprints,
  stayTime,
  cost,
  distance,
  hours,
  parking,
  recommended = false,
  selected = false,
  onDetail,
  onSelect,
  className,
  ...props
}: PlaceCardProps) {
  const compact = variant === "compact";
  const subtitle = [category, location].filter(Boolean).join(" · ");
  const defaultInfo = [
    travelTime && { label: "이동 시간", value: travelTime },
    stayTime && { label: "체류 시간", value: stayTime },
    cost && { label: "비용", value: cost },
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const compactInfo = [
    travelTime && { label: "이동 시간", value: travelTime, icon: travelIcon },
    distance && { label: "거리", value: distance, icon: MapPin },
    hours && { label: "운영 시간", value: hours, icon: Clock },
    parking && { label: "주차", value: parking, icon: ParkingCircle },
  ].filter(
    (item): item is { label: string; value: string; icon: typeof Clock } =>
      Boolean(item),
  );

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-neutral-100",
          compact ? "aspect-video" : "aspect-4/3",
        )}
      >
        <PlaceImage
          imageUrl={imageUrl}
          imageAlt={imageAlt ?? title}
          sizes={compact ? "320px" : "400px"}
        />
        {compact && recommended && (
          <Tag
            variant="purple"
            appearance="solid"
            size="sm"
            className="absolute top-3 left-3"
          >
            AI 추천
          </Tag>
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-3 p-4" : "gap-4 p-4",
        )}
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-3">
            <h3
              className={cn(
                "min-w-0 flex-1 font-semibold text-neutral-900",
                compact ? "line-clamp-2 text-lg" : "text-xl",
              )}
            >
              {title}
            </h3>
            {rating !== undefined ? (
              <PlaceRating value={rating} reviewCount={reviewCount} />
            ) : (
              <span className="shrink-0 text-sm text-neutral-500">
                리뷰없음
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 truncate text-sm text-neutral-700">{subtitle}</p>
          )}
        </div>

        {(compact ? compactInfo : defaultInfo).length > 0 && (
          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3">
            {(compact ? compactInfo : defaultInfo).map((item) => (
              <InfoRow key={item.label} {...item} compact={compact} />
            ))}
          </div>
        )}

        {(onDetail || (compact && onSelect)) && (
          <div className={cn("mt-auto flex gap-2", !compact && "pt-1")}>
            {onDetail && (
              <Button
                variant={compact ? "outline" : "default"}
                size="sm"
                className="min-w-0 flex-1 whitespace-nowrap"
                onClick={onDetail}
              >
                상세보기
              </Button>
            )}
            {compact && onSelect && (
              <Button
                variant="secondary"
                size="sm"
                className="min-w-0 flex-1 whitespace-nowrap"
                disabled={selected}
                onClick={onSelect}
              >
                {selected ? "선택완료" : "선택하기"}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
