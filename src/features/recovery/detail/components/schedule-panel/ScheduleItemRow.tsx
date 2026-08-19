import { ChevronDown, GripVertical, Trash2 } from "lucide-react";

import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import { Tag } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import { CATEGORY_TAG_VARIANT } from "../../mocks/placeMock";
import type { ScheduleItem, TransportMode } from "../../mocks/scheduleMock";

const TRANSPORT_ORDER: TransportMode[] = ["walk", "car", "transit"];

const TRANSPORT_ICONS: Record<TransportMode, typeof carIcon> = {
  car: carIcon,
  walk: walkIcon,
  transit: trainIcon,
};

/**
 * ScheduleInputPanel 일정 목록의 행 하나.
 *
 * TODO: FieldButton(방문시간/체류시간) 타임피커 연동.
 * grid-cols는 ScheduleInputPanel 헤더 행과 같은 값으로 유지.
 */
export interface ScheduleItemRowProps {
  item: ScheduleItem;
  onTransportChange: (mode: TransportMode) => void;
  onRemove: () => void;
}

function FieldButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-400"
    >
      {label}
      <ChevronDown className="size-3 text-neutral-500" />
    </button>
  );
}

export function ScheduleItemRow({
  item,
  onTransportChange,
  onRemove,
}: ScheduleItemRowProps) {
  return (
    <div className="grid grid-cols-[12px_42px_minmax(0,1fr)_85px_117px_155px_32px] items-center gap-4 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
      <GripVertical
        className="size-4 cursor-grab text-neutral-400"
        aria-hidden="true"
      />

      <div className="text-sm text-neutral-900">{item.time}</div>

      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-medium text-neutral-900">
          {item.placeName}
        </span>
        <Tag
          variant={CATEGORY_TAG_VARIANT[item.categoryTag] ?? "gray"}
          size="sm"
          className="shrink-0 border-0"
        >
          {item.categoryTag}
        </Tag>
      </div>

      <FieldButton label={item.visitTime} />
      <FieldButton label={item.stayDuration} />

      <div className="flex items-center justify-start gap-2">
        {TRANSPORT_ORDER.map((mode) => {
          const isSelected = item.transport === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onTransportChange(mode)}
              aria-pressed={isSelected}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg border transition-colors",
                isSelected
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-800 hover:border-neutral-400",
              )}
            >
              <span
                aria-hidden="true"
                className="mask-center mask-no-repeat mask-contain block size-3.5 bg-current"
                style={{
                  maskImage: `url(${TRANSPORT_ICONS[mode].src})`,
                  WebkitMaskImage: `url(${TRANSPORT_ICONS[mode].src})`,
                }}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="일정에서 삭제"
        className="flex size-6 items-center justify-center justify-self-start rounded-md text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
