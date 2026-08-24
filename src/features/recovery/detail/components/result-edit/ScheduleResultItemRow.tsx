import { ChevronDown, Clock, GripVertical, Trash2 } from "lucide-react";

import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import type { TransportMode } from "../../mocks/scheduleMock";
import type { ResultScheduleItem } from "../../mocks/resultEditMock";

const TRANSPORT_ORDER: TransportMode[] = ["walk", "car", "transit"];

const TRANSPORT_ICONS: Record<TransportMode, typeof carIcon> = {
  car: carIcon,
  walk: walkIcon,
  transit: trainIcon,
};

const TRANSPORT_LABEL: Record<TransportMode, string> = {
  car: "자동차",
  walk: "도보",
  transit: "대중교통",
};

/**
 * ScheduleResultPanel 일정 목록 한 줄. 좌측 패널 폭이 좁아 1단계
 * ScheduleItemRow(7컬럼 grid)를 그대로 쓰기 어려워 2줄 컴팩트 레이아웃으로
 * 만든다. 방문시간/체류시간 버튼은 1단계와 마찬가지로 아직 타임피커
 * 연동 전(TODO)이라 값 표시만 한다. 이동수단은 실제로 토글된다.
 *
 * 추천이 적용된 항목(changed)에는 "추천 일정 적용"/"AI 추천" 뱃지와
 * 점선 강조 테두리를 표시한다.
 */
export interface ScheduleResultItemRowProps {
  item: ResultScheduleItem;
  onTransportChange: (mode: TransportMode) => void;
  onRemove: () => void;
}

function FieldButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex flex-1 items-center justify-between gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-400"
    >
      {label}
      <ChevronDown className="size-3 text-neutral-500" />
    </button>
  );
}

export function ScheduleResultItemRow({
  item,
  onTransportChange,
  onRemove,
}: ScheduleResultItemRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2.5",
        item.changed
          ? "border-2 border-dashed border-primary-400 bg-primary-50/40"
          : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="mt-0.5 size-4 shrink-0 cursor-grab text-neutral-400"
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {item.placeName}
            </span>
            <Tag
              variant={getCategoryTagVariant(item.categoryTag)}
              size="sm"
              className="shrink-0 border-0"
            >
              {item.categoryTag}
            </Tag>
            {item.changed && (
              <>
                <Tag variant="mint" size="sm" className="shrink-0">
                  추천 일정 적용
                </Tag>
                <Tag
                  variant="purple"
                  appearance="solid"
                  size="sm"
                  className="shrink-0"
                >
                  AI 추천
                </Tag>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Clock className="size-3" aria-hidden="true" />
            {item.time} ({item.stayDuration} 소요)
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label="일정에서 삭제"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-6">
        <FieldButton label={item.visitTime} />
        <FieldButton label={item.stayDuration} />
        <div className="flex shrink-0 items-center gap-1">
          {TRANSPORT_ORDER.map((mode) => {
            const isSelected = item.transport === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => onTransportChange(mode)}
                aria-pressed={isSelected}
                aria-label={TRANSPORT_LABEL[mode]}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg border transition-colors",
                  isSelected
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-800 hover:border-neutral-400",
                )}
              >
                <span
                  aria-hidden="true"
                  className="mask-center mask-no-repeat mask-contain block size-3 bg-current"
                  style={{
                    maskImage: `url(${TRANSPORT_ICONS[mode].src})`,
                    WebkitMaskImage: `url(${TRANSPORT_ICONS[mode].src})`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
