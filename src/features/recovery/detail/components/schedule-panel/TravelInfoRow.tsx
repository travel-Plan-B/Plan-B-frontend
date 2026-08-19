import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import {
  IconBadge,
  type IconBadgeVariant,
} from "@/shared/components/ui/IconBadge";
import type { ScheduleItem, TransportMode } from "../../mocks/scheduleMock";

/**
 * ScheduleItemRow와 다음 ScheduleItemRow 사이에 끼워 넣는 "이동 정보" 줄.
 * item.travelInfo가 있을 때만 ScheduleInputPanel이 렌더링한다.
 */
const TRANSPORT_ICONS: Record<TransportMode, typeof carIcon> = {
  car: carIcon,
  walk: walkIcon,
  transit: trainIcon,
};

/** Figma 실측 기준 매핑: 자동차=purple, 도보=pink, 대중교통=orange. */
const TRANSPORT_BADGE_VARIANT: Record<TransportMode, IconBadgeVariant> = {
  car: "purple",
  walk: "pink",
  transit: "orange",
};

/** 연결선/점 색상도 아이콘과 같은 계열로 맞춘다. */
const TRANSPORT_LINE_COLOR: Record<TransportMode, string> = {
  car: "bg-purple-500",
  walk: "bg-rose-500",
  transit: "bg-yellow-600",
};

export function TravelInfoRow({
  travelInfo,
}: {
  travelInfo: NonNullable<ScheduleItem["travelInfo"]>;
}) {
  const lineColor = TRANSPORT_LINE_COLOR[travelInfo.mode];

  return (
    <div className="flex gap-3 py-2 pl-6.5 text-xs text-neutral-500">
      <div className="relative flex w-5 shrink-0 items-center justify-center">
        <span
          className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${lineColor}`}
        />
        <span
          className={`relative size-1.5 shrink-0 rounded-full ${lineColor}`}
        />
      </div>

      <div className="flex items-center gap-2">
        <IconBadge
          icon={TRANSPORT_ICONS[travelInfo.mode]}
          variant={TRANSPORT_BADGE_VARIANT[travelInfo.mode]}
          size="sm"
          className="size-6 [&>span]:size-3.5"
        />
        <div className="flex flex-col">
          <span className="text-neutral-700">{travelInfo.label}</span>
          <span className="text-neutral-600">
            예상 이동 시간: {travelInfo.estimatedMinutes}분 | 거리:{" "}
            {travelInfo.distanceKm}km
          </span>
        </div>
      </div>
    </div>
  );
}
