import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, TriangleAlert, Trash2 } from "lucide-react";

import carIcon from "@/shared/assets/icons/car.svg";
import trainIcon from "@/shared/assets/icons/train.svg";
import walkIcon from "@/shared/assets/icons/walk.svg";
import { Tag } from "@/shared/components/ui/Tag";
import { TimePicker } from "@/shared/components/ui/TimePicker";
import { cn } from "@/shared/lib/cn";
import { getCategoryTagVariant } from "@/features/recovery/lib/categoryTag";
import {
  formatStayDuration,
  parseStayDuration,
  parseVisitTime,
  STAY_HOUR_OPTIONS,
  STAY_MINUTE_OPTIONS,
  VISIT_HOUR_OPTIONS,
  VISIT_MINUTE_OPTIONS,
} from "../../lib/scheduleTime";
import type { ScheduleConflict } from "../../lib/scheduleConflicts";
import type { ScheduleItem, TransportMode } from "../../mocks/scheduleMock";

const TRANSPORT_ORDER: TransportMode[] = ["walk", "car", "transit"];

const TRANSPORT_ICONS: Record<TransportMode, typeof carIcon> = {
  car: carIcon,
  walk: walkIcon,
  transit: trainIcon,
};

const FIELD_BUTTON_CLASSNAME =
  "w-full justify-between gap-1 rounded-lg border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-400";

/**
 * ScheduleInputPanel 일정 목록의 행 하나. 행 전체를 잡고 위아래로 드래그해 순서를 바꿀 수 있다.
 * 내부 인터랙티브 요소(TimePicker/이동수단/삭제)는 onPointerDown에서 stopPropagation해
 * 클릭이 드래그로 오인식되지 않게 한다.
 *
 * 이름/시간/이동수단을 한 줄 grid로 두면 좁은 화면(1024~1280px)에서 고정폭
 * 컬럼들이 공간을 다 차지해 장소 이름이 0폭으로 눌려 안 보이는 문제가 있었다
 * — 3단계 ScheduleResultItemRow와 같은 2줄 flex 구조로 바꿔 이름 줄을
 * 독립시켰다.
 */
export interface ScheduleItemRowProps {
  item: ScheduleItem;
  /** 그 DAY의 마지막 일정이면 다음 장소로 이동할 일이 없어 이동수단 선택이 의미가 없다. */
  isLast?: boolean;
  /** 다음 일정과 시간이 겹치면(#121, /api/v1/schedule/validate) 빨간 테두리 + 부족 시간을 보여준다. */
  conflict?: ScheduleConflict | null;
  onVisitTimeChange: (value: string) => void;
  onStayDurationChange: (value: string) => void;
  onTransportChange: (mode: TransportMode) => void;
  onRemove: () => void;
}

export function ScheduleItemRow({
  item,
  isLast = false,
  conflict,
  onVisitTimeChange,
  onStayDurationChange,
  onTransportChange,
  onRemove,
}: ScheduleItemRowProps) {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform) }}
      className={cn(
        "flex touch-none flex-col gap-2 rounded-xl border bg-white px-3 py-2.5 select-none",
        "cursor-grab active:cursor-grabbing",
        isDragging
          ? "relative z-10 border-dashed border-primary-300 bg-primary-50/40"
          : conflict
            ? "border-rose-500 bg-rose-50/40"
            : "border-neutral-200",
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="mt-0.5 size-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 text-sm text-neutral-900">{item.time}</span>
          <span className="truncate text-sm font-medium text-neutral-900">
            {item.placeName}
          </span>
          <Tag
            variant={getCategoryTagVariant(item.categoryTag)}
            size="xs"
            className="shrink-0 border-0"
          >
            {item.categoryTag}
          </Tag>
        </div>

        <button
          type="button"
          onClick={onRemove}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="일정에서 삭제"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex items-end gap-2 pl-6">
        <div
          className="flex flex-1 flex-col gap-0.5"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span className="text-xs text-neutral-600">방문 시간</span>
          <TimePicker
            title="방문 시간 선택"
            value={parseVisitTime(item.visitTime)}
            onChange={(value) =>
              onVisitTimeChange(
                `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`,
              )
            }
            hourOptions={VISIT_HOUR_OPTIONS}
            minuteOptions={VISIT_MINUTE_OPTIONS}
            columnLabels={{ hour: "시", minute: "분" }}
            className={FIELD_BUTTON_CLASSNAME}
          />
        </div>
        <div
          className="flex flex-1 flex-col gap-0.5"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span className="text-xs text-neutral-600">체류 시간</span>
          <TimePicker
            title="체류 시간 선택"
            value={parseStayDuration(item.stayDuration)}
            onChange={(value) =>
              onStayDurationChange(formatStayDuration(value))
            }
            hourOptions={STAY_HOUR_OPTIONS}
            minuteOptions={STAY_MINUTE_OPTIONS}
            columnLabels={{ hour: "시간", minute: "분" }}
            formatValue={formatStayDuration}
            isValid={(value) => value.hour > 0 || value.minute > 0}
            className={FIELD_BUTTON_CLASSNAME}
          />
        </div>

        <div
          className="flex shrink-0 flex-col gap-0.5"
          title={
            isLast ? "마지막 일정은 이동수단을 선택할 필요가 없어요" : undefined
          }
        >
          <span className="text-xs text-neutral-600">이동수단</span>
          <div className="flex items-center gap-1">
            {TRANSPORT_ORDER.map((mode) => {
              const isSelected = item.transport === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isLast}
                  onClick={() => onTransportChange(mode)}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg border transition-colors",
                    isSelected
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-800 hover:border-neutral-400",
                    "disabled:cursor-not-allowed disabled:border-none disabled:bg-neutral-900/10 disabled:text-neutral-900/40 disabled:hover:border-transparent",
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

      {conflict && (
        <div className="flex items-center gap-1 pl-6 text-xs text-rose-600">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          다음 일정과 {conflict.shortfallMinutes}분 부족해요 · 방문 시간이나
          체류 시간을 조정해주세요
        </div>
      )}
    </div>
  );
}
