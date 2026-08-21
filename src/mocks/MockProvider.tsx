"use client";

import { useEffect, useState, type ReactNode } from "react";

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "true";

/**
 * NEXT_PUBLIC_API_MOCKING=true 일 때만 MSW worker를 시작한다.
 * 기본값은 false라 실제 백엔드 API를 그대로 호출한다.
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!isMockingEnabled);

  useEffect(() => {
    if (!isMockingEnabled) return;
    import("./browser").then(({ startMockWorker }) =>
      startMockWorker().then(() => setIsReady(true)),
    );
  }, []);

  if (!isReady) return null;
  return children;
}
