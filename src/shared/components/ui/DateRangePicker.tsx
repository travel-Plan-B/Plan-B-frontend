"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { usePopoverPicker } from "@/shared/hooks/usePopoverPicker";
import { cn } from "@/shared/lib/cn";
import {
  dayCount,
  formatDate,
  getMonthGrid,
  isSameDay,
  startOfDay,
} from "@/shared/lib/date";
import { Button } from "./Button";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  placeholder?: string;
  // 시작일부터 최대 며칠까지 선택 가능한지 (오늘 포함). 기본 5일.
  maxDays?: number;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatRange(value: DateRange) {
  if (!value.start) return "";
  if (!value.end || isSameDay(value.start, value.end)) {
    return formatDate(value.start);
  }
  return `${formatDate(value.start)} - ${formatDate(value.end)}`;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "여행 기간을 선택해주세요",
  maxDays = 5,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const {
    open,
    setOpen,
    draft,
    setDraft,
    triggerRef,
    panelRef,
    panelPositionStyle,
    handleOpen,
    handleConfirm,
  } = usePopoverPicker(value, onChange);
  const [viewDate, setViewDate] = useState(() => value.start ?? new Date());

  const today = startOfDay(new Date());

  // 과거 날짜, 그리고 시작일만 선택된 상태에서 maxDays를 넘어서는 날짜는 비활성화.
  const isDisabled = (date: Date) => {
    if (date < today) return true;
    if (draft.start && !draft.end && date >= draft.start) {
      return dayCount(draft.start, date) > maxDays;
    }
    return false;
  };

  const handleSelect = (date: Date) => {
    if (isDisabled(date)) return;
    if (!draft.start || draft.end) return setDraft({ start: date, end: null });
    if (date < draft.start) return setDraft({ start: date, end: null });
    setDraft({ start: draft.start, end: date });
  };

  const isInRange = (date: Date) => {
    if (!draft.start) return false;
    const end = draft.end ?? draft.start;
    return date >= draft.start && date <= end;
  };

  const cells = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          handleOpen();
          setViewDate(value.start ?? new Date());
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-left text-sm text-neutral-900 transition-colors hover:border-neutral-400",
          "disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-50 disabled:text-neutral-400",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-neutral-600" />
        <span className={cn(!value.start && "text-neutral-500")}>
          {value.start ? formatRange(value) : placeholder}
        </span>
      </button>
      {open &&
        // Modal/드롭다운과 동일하게 Portal로 렌더링해 부모의 overflow에 잘리지 않게 한다.
        createPortal(
          <div
            ref={panelRef}
            style={panelPositionStyle}
            className="z-50 w-80 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="flex size-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold text-neutral-900">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewDate(
                    new Date(
                      viewDate.getFullYear(),
                      viewDate.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="flex size-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs text-neutral-500">
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} className="py-1">
                  {weekday}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, index) => {
                if (!date) return <span key={index} />;

                const disabledDay = isDisabled(date);
                const isEdge =
                  (draft.start && isSameDay(date, draft.start)) ||
                  (draft.end && isSameDay(date, draft.end));
                const inRange = isInRange(date);

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => handleSelect(date)}
                    className={cn(
                      "mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors",
                      disabledDay && "cursor-not-allowed text-neutral-400",
                      !disabledDay &&
                        !inRange &&
                        "text-neutral-900 hover:bg-neutral-100",
                      inRange && !isEdge && "bg-primary-50 text-primary-700",
                      isEdge && "bg-primary-500 text-white",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              최대 {maxDays}일까지 선택할 수 있어요.
            </p>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-sm"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-sm"
                disabled={!draft.start}
                onClick={handleConfirm}
              >
                확인
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
