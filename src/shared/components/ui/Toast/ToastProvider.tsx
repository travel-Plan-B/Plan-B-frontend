"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";

import "./ToastProvider.css";

// 노출 위치와 지속 시간을 여기서 전역으로 통일한다 (페이지마다 다르게 만들지 않음).
// Modal(z-index 기준값)보다 항상 위에 보이도록 z-index를 높게 잡는다.
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      duration={3000}
      gap={8}
      style={
        {
          zIndex: 9999,
          // Figma 기준 344px, 모바일에서는 좌우 8px 여백 확보를 위해 축소 (ToastCard.tsx, ToastProvider.css와 동일 값).
          "--width": "min(344px, calc(100vw - 16px))",
        } as CSSProperties
      }
    />
  );
}
