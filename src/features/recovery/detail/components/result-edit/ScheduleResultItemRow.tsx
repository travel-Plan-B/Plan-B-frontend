import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical, Trash2 } from "lucide-react";

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
import {
  TRANSPORT_ICONS,
  TRANSPORT_LABEL,
  TRANSPORT_ORDER,
} from "../../lib/transportOptions";
import type { ResultScheduleItem } from "../../mocks/resultEditMock";
import type { TransportMode } from "../../mocks/scheduleMock";

const FIELD_BUTTON_CLASSNAME =
  "w-full justify-between gap-1 rounded-lg border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 hover:border-neutral-400";

/**
 * ScheduleResultPanel 일정 목록 한 줄. 1단계 ScheduleItemRow와 같은 방식으로
 * 행 전체를 드래그해 순서를 바꿀 수 있고, 방문/체류 시간도 같은 TimePicker로
 * 편집한다. 내부 인터랙티브 요소는 onPointerDown에서 stopPropagation해
 * 클릭이 드래그로 오인식되지 않게 한다.
 *
 * 복구 대상(isRecommendTarget)이면 클릭해서(드래그가 아니라 단순 클릭)
 * 오른쪽 패널에 그 항목의 추천을 띄울 수 있다(onSelect가 있을 때만 — 복구
 * 대상이 아닌 항목은 클릭해도 아무 일도 없다). 추천 후보 중 하나를 실제로
 * 적용한 항목(changed)에만 "추천 일정 적용" 뱃지와 강조 테두리를 표시하고,
 * 그 중에서도 AI 대표 추천을 그대로 적용한 경우(appliedFromAi)에만 "AI 추천"
 * 뱃지를 같이 보여준다 — 후보를 받은 것만으로는 아무 뱃지도 뜨지 않는다.
 */
export interface ScheduleResultItemRowProps {
  item: ResultScheduleItem;
  /** 그 DAY의 마지막 일정이면 다음 장소로 이동할 일이 없어 이동수단 선택이 의미가 없다. */
  isLast?: boolean;
  active?: boolean;
  onSelect?: () => void;
  onVisitTimeChange: (value: string) => void;
  onStayDurationChange: (value: string) => void;
  onTransportChange: (mode: TransportMode) => void;
  onRemove: () => void;
}

export function ScheduleResultItemRow({
  item,
  isLast = false,
  active,
  onSelect,
  onVisitTimeChange,
  onStayDurationChange,
  onTransportChange,
  onRemove,
}: ScheduleResultItemRowProps) {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform) }}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        "flex touch-none flex-col gap-2 rounded-xl border px-3 py-2.5 select-none",
        "cursor-grab active:cursor-grabbing",
        onSelect && "cursor-pointer",
        isDragging &&
          "relative z-10 border-dashed border-primary-300 bg-primary-50/60",
        !isDragging &&
          (active
            ? "border-2 border-primary-500 bg-primary-50/60"
            : item.changed
              ? "border-2 border-dashed border-primary-400 bg-primary-50/60"
              : item.isRecommendTarget
                ? "border-dashed border-neutral-300 bg-white"
                : "border-neutral-200 bg-white"),
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical
          className="mt-0.5 size-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {item.placeName}
            </span>
            <Tag
              variant={getCategoryTagVariant(item.categoryTag)}
              size="xs"
              className="shrink-0 border-0"
            >
              {item.categoryTag}
            </Tag>
            {item.changed && (
              <Tag variant="mint" size="sm" className="shrink-0">
                추천 일정 적용
              </Tag>
            )}
            {item.changed && item.appliedFromAi && (
              <Tag
                variant="purple"
                appearance="solid"
                size="sm"
                className="shrink-0"
              >
                AI 추천
              </Tag>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-600">
            <Clock className="size-3" aria-hidden="true" />
            {item.time} ({item.stayDuration} 소요)
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="일정에서 삭제"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-6">
        <span
          className="flex-1"
          onPointerDown={(event) => event.stopPropagation()}
        >
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
        </span>
        <span
          className="flex-1"
          onPointerDown={(event) => event.stopPropagation()}
        >
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
        </span>
        <div
          className="flex shrink-0 items-center gap-1"
          title={
            isLast ? "마지막 일정은 이동수단을 선택할 필요가 없어요" : undefined
          }
        >
          {TRANSPORT_ORDER.map((mode) => {
            const isSelected = item.transport === mode;

            return (
              <button
                key={mode}
                type="button"
                disabled={isLast}
                onClick={(event) => {
                  event.stopPropagation();
                  onTransportChange(mode);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                aria-pressed={isSelected}
                aria-label={TRANSPORT_LABEL[mode]}
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
  );
}
