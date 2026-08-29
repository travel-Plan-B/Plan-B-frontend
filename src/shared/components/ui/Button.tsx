import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEventHandler,
} from "react";

import { cn } from "@/shared/lib/cn";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "ghost-danger"
  | "destructive";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-neutral-900 text-white hover:opacity-90",
  secondary: "bg-primary-500 text-white hover:opacity-90",
  outline:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50",
  ghost: "bg-transparent text-neutral-900 hover:bg-neutral-50",
  "ghost-danger": "bg-transparent text-danger-500 hover:text-danger-600",
  destructive: "bg-danger-500 text-white hover:bg-danger-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-2", // 세로 8px 가로 12px
  md: "px-6 py-3.5", // 세로 14px 가로 24px
  lg: "px-10 py-4", // 세로 16px 가로 40px
};

export function Button({
  variant = "default",
  size = "md",
  className,
  type = "button",
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  // 네트워크가 느리면 응답이 오기 전에 같은 버튼을 연달아 눌러 요청이
  // 중복으로 나가는 경우가 있다(장소 추가, 일정 제출 등). onClick이 Promise를
  // 반환하는 동안(비동기 제출 핸들러일 때만) 버튼을 눌러도 무시하고, 완료되면
  // 다시 눌러지게 한다 — onClick이 동기 함수면 이 로직은 아예 개입하지 않는다.
  //
  // 가드 값은 state가 아니라 ref로 둔다: state 업데이트는 다음 리렌더까지
  // 반영이 미뤄져서, 리렌더가 끝나기 전에 연달아 들어온 클릭은 여전히 옛
  // isPending(false)을 보고 통과해버린다(실측: 5연타 중 3번 통과). ref는
  // 대입 즉시 다음 클릭에서도 최신값으로 읽혀서 이 레이스가 없다. disabled
  // 표시(버튼 비활성화 스타일)만 별도 state로 같이 들고 간다.
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isPendingRef.current) return;
    // onClick의 선언된 반환 타입은 void지만, 실제로 async 함수가 오면
    // 런타임엔 Promise가 반환된다 — void 반환 함수 타입은 어떤 반환값이든
    // 허용하는 TS 규칙 덕분에 async onClick도 타입 에러 없이 그대로 쓸 수 있다.
    const result = onClick?.(event) as unknown;
    if (result instanceof Promise) {
      isPendingRef.current = true;
      setIsPending(true);
      result.finally(() => {
        isPendingRef.current = false;
        setIsPending(false);
      });
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isPending}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl text-base font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-neutral-900/10 disabled:text-neutral-900/40 disabled:border-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
