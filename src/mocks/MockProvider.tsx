"use client";

import { useEffect, useState } from "react";

// 백엔드가 아직 연결되지 않은 개발 환경에서만 MSW 워커를 띄운다.
// 워커가 준비되기 전까지 children을 렌더링하지 않아, 준비 전에 나간 요청이
// 목업되지 않고 실패하는 걸 막는다.
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(
    process.env.NODE_ENV !== "development",
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    import("./browser").then(({ startWorker }) => {
      startWorker().then(() => setIsReady(true));
    });
  }, []);

  if (!isReady) return null;

  return children;
}
