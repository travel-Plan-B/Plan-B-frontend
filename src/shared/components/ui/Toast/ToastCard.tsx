import { Check } from "lucide-react";

import { cn } from "@/shared/lib/cn";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastCardProps {
  type: ToastType;
  message: string;
}

// 아이콘 원형 배경/카드 보더는 타입마다 같은 톤(primary-500, purple-600 등)을 공유한다.
const typeStyles: Record<ToastType, { card: string; accent: string }> = {
  success: {
    card: "border-primary-500 bg-primary-50",
    accent: "bg-primary-500",
  },
  info: { card: "border-purple-600 bg-purple-50", accent: "bg-purple-600" },
  warning: { card: "border-yellow-600 bg-yellow-50", accent: "bg-yellow-600" },
  error: { card: "border-rose-500 bg-rose-50", accent: "bg-rose-500" },
};

export function ToastCard({ type, message }: ToastCardProps) {
  return (
    <div
      role="status"
      className={cn(
        // sonner의 --width는 toast.custom()에는 안정적으로 상속되지 않아 카드에 직접 폭을 준다.
        // 모바일 좌우 여백(8px, design-system.md Responsive 기준) 확보를 위해 뷰포트가 좁을 땐 축소하고,
        // 그 외에는 Figma 기준 344px을 유지한다.
        // max-w는 반드시 px 고정값(max-w-[344px])으로 준다 — max-w-86 같은 rem 기반 유틸리티는
        // 브라우저/OS 글꼴 크기 설정에 따라 실제 px 값이 달라져 Figma 스펙보다 커질 수 있다.
        "flex w-[calc(100vw-16px)] max-w-[344px] items-center gap-2.5 rounded-xl border bg-white px-5 py-3 shadow-md",
        typeStyles[type].card,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-white",
          typeStyles[type].accent,
        )}
      >
        {type === "success" ? (
          <Check className="size-3.5" strokeWidth={3} />
        ) : (
          <span className="text-sm leading-none font-bold">!</span>
        )}
      </span>
      <p className="text-base font-bold text-neutral-900">{message}</p>
    </div>
  );
}
