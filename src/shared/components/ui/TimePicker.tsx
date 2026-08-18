"use client";

import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@ncdai/react-wheel-picker";
import "@ncdai/react-wheel-picker/style.css";
import { ChevronDown, Clock } from "lucide-react";
import { createPortal } from "react-dom";

import { usePopoverPicker } from "@/shared/hooks/usePopoverPicker";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

export type TimePickerOption = WheelPickerOption<number>;

export interface TimePickerValue {
  hour: number;
  minute: number;
}

export interface TimePickerProps {
  title: string;
  value: TimePickerValue;
  onChange: (value: TimePickerValue) => void;
  hourOptions: TimePickerOption[];
  minuteOptions: TimePickerOption[];
  columnLabels?: { hour: string; minute: string };
  formatValue?: (value: TimePickerValue) => string;
  // "확인" 누르기 전까지 잘못된 조합(예: 체류 0시간 0분)을 걸러내기 위한 검증 함수.
  // 기본값은 항상 true라서 아무 제약이 없고, 컴포넌트를 쓰는 쪽에서 필요할 때만 넘기면 됨.
  isValid?: (value: TimePickerValue) => boolean;
  disabled?: boolean;
  className?: string;
}

const defaultFormat = (value: TimePickerValue) =>
  `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;

const wheelClassNames = {
  optionItem: "text-sm text-neutral-400",
  highlightWrapper: "rounded-lg bg-primary-50",
  highlightItem: "text-sm font-semibold text-neutral-900",
};

export function TimePicker({
  title,
  value,
  onChange,
  hourOptions,
  minuteOptions,
  columnLabels,
  formatValue = defaultFormat,
  isValid = () => true,
  disabled = false,
  className,
}: TimePickerProps) {
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 transition-colors hover:border-neutral-400",
          "disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-50 disabled:text-neutral-400",
          className,
        )}
      >
        <span>{formatValue(value)}</span>
        <ChevronDown className="size-4 text-neutral-900" />
      </button>
      {open &&
        // 패널은 document.body 최상위로 Portal 렌더링해서 모달/카드 같은
        // 부모 요소의 overflow:hidden에 잘리지 않게 한다.
        createPortal(
          <div
            ref={panelRef}
            style={panelPositionStyle}
            className="z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary-50">
                <Clock className="size-4 text-primary-500" />
              </span>
              <span className="text-base font-semibold text-neutral-900">
                {title}
              </span>
            </div>
            {columnLabels && (
              <div className="flex gap-2 text-center text-sm text-neutral-500">
                <span className="flex-1">{columnLabels.hour}</span>
                <span className="flex-1">{columnLabels.minute}</span>
              </div>
            )}
            {/*
              iOS 스타일 휠 선택 UI(@ncdai/react-wheel-picker) 사용.
              직접 스크롤 로직을 짜봤는데 CSS scroll-snap이랑 충돌해서
              선택값이 어중간한 위치에 멈추는 버그가 있었음 -> 라이브러리로 교체.

              휠 높이는 Tailwind 클래스(h-*)로 못 줄인다: 라이브러리가 내부에서
              optionItemHeight * visibleCount로 인라인 style height를 직접
              계산해서 넣기 때문에 CSS 클래스보다 우선함. 그래서 높이를 바꾸려면
              반드시 이 두 prop을 써야 함 (visibleCount는 4의 배수여야 함).
            */}
            <WheelPickerWrapper className="items-center gap-2">
              <WheelPicker<number>
                options={hourOptions}
                value={draft.hour}
                onValueChange={(hour) =>
                  setDraft((prev) => ({ ...prev, hour }))
                }
                optionItemHeight={32}
                visibleCount={12}
                classNames={wheelClassNames}
              />
              <WheelPicker<number>
                options={minuteOptions}
                value={draft.minute}
                onValueChange={(minute) =>
                  setDraft((prev) => ({ ...prev, minute }))
                }
                optionItemHeight={32}
                visibleCount={12}
                classNames={wheelClassNames}
              />
            </WheelPickerWrapper>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-sm"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              {/* isValid(draft)가 false면(예: 체류 0시간 0분) 확인 버튼을 비활성화해서 확정을 막는다. */}
              <Button
                variant="default"
                size="sm"
                className="flex-1 text-sm"
                disabled={!isValid(draft)}
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
