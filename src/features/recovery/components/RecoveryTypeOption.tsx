import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type RecoveryTypeOptionSize = "md" | "sm";

export interface RecoveryTypeOptionProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "title"
> {
  icon: ReactNode;
  title: string;
  description: string;
  selected?: boolean;
  size?: RecoveryTypeOptionSize;
  /**
   * 제목/설명 font-size를 화면별로 다르게 줘야 할 때만 쓰는 override.
   * 공용 컴포넌트라 기본값(titleSizeStyles/descriptionSizeStyles)은 그대로
   * 두고, 특정 화면(예: 2단계 ConditionPanel의 좁은 카드)에서만 clamp 등을
   * 적용하고 싶을 때 여기로 넘긴다.
   */
  titleClassName?: string;
  descriptionClassName?: string;
}

const titleSizeStyles: Record<RecoveryTypeOptionSize, string> = {
  md: "text-base",
  sm: "text-sm",
};

const descriptionSizeStyles: Record<RecoveryTypeOptionSize, string> = {
  md: "text-sm",
  sm: "text-xs",
};

// size="sm"는 텍스트만 줄고 padding은 그대로(p-4)라, 2단계처럼 좁은 카드에서
// 설명이 2~3줄로 wrap되면 카드 높이가 늘어나 패널 전체에 세로 스크롤이
// 생겼다 — sm일 때는 padding도 같이 줄인다.
const paddingSizeStyles: Record<RecoveryTypeOptionSize, string> = {
  md: "p-4",
  sm: "p-3",
};

const iconGapSizeStyles: Record<RecoveryTypeOptionSize, string> = {
  md: "mt-3",
  sm: "mt-2",
};

export function RecoveryTypeOption({
  icon,
  title,
  description,
  selected = false,
  size = "md",
  className,
  titleClassName,
  descriptionClassName,
  type = "button",
  ...props
}: RecoveryTypeOptionProps) {
  return (
    <button
      type={type}
      {...props}
      aria-pressed={selected}
      className={cn(
        "flex h-full w-full cursor-pointer flex-col items-start rounded-2xl border text-left transition-colors",
        paddingSizeStyles[size],
        "focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-primary-500 bg-primary-25 border-2"
          : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50",
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>

      <span className={cn(iconGapSizeStyles[size], "min-w-0")}>
        <span
          className={cn(
            "block font-medium text-neutral-900",
            titleSizeStyles[size],
            titleClassName,
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "mt-1 block text-neutral-700",
            descriptionSizeStyles[size],
            descriptionClassName,
          )}
        >
          {description}
        </span>
      </span>
    </button>
  );
}
