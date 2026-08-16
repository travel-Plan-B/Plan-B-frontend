"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/cn";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const noopSubscribe = () => () => {};
// 서버 렌더링에서는 항상 false, 클라이언트에 마운트된 뒤에만 true를 반환한다.
// useState + useEffect(setMounted)로 흉내내면 setState-in-effect라 린트에
// 걸리므로, 구독이 필요 없는 이 용도엔 useSyncExternalStore를 사용한다.
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

// Portal로 document.body에 직접 렌더링해서 부모 요소의 stacking context,
// overflow 영향을 받지 않게 한다 (design-system.md Modal 섹션).
export function Modal({
  open,
  onClose,
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ModalProps) {
  // "use client" 컴포넌트도 서버에서 먼저 렌더링되기 때문에, open이 true인 채로
  // 첫 렌더링되면 document가 없는 서버에서 document.body에 접근해 크래시한다.
  // mounted는 클라이언트에 실제로 붙은 뒤에만 true가 되므로, portal은 그 이후에만
  // 렌더링된다.
  const mounted = useIsMounted();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // 모달을 열기 전 포커스를 기억해뒀다가 닫을 때 트리거로 되돌린다.
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // 열려있는 동안 Tab 포커스가 모달 밖으로 나가지 않도록 순환시킨다.
      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 모달이 열려있는 동안 배경 스크롤을 막는다.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={(event) => {
        // 오버레이 자체를 클릭했을 때만 닫는다 (모달 내부 클릭이 버블링되어도
        // event.target은 내부 요소이므로 currentTarget과 달라 닫히지 않는다).
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
