"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { ROUTES } from "@/shared/config/routes";
import { useSimpleRecoveryStore } from "./store/useSimpleRecoveryStore";

interface SimpleRecoveryStartLinkProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** 명시적인 새 간편 복구 진입에서만 이전 세션을 비운다. 단계 이동과 뒤로가기는 이 링크를 거치지 않는다. */
export function SimpleRecoveryStartLink({
  children,
  className,
  onClick,
}: SimpleRecoveryStartLinkProps) {
  const reset = useSimpleRecoveryStore((state) => state.reset);

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    reset();
    onClick?.(event);
  };

  return (
    <Link
      href={ROUTES.RECOVERY_SIMPLE}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
