"use client";

import { RecoveryStartButton } from "./RecoveryStartButton";

export function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-140px)] flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <RecoveryStartButton size="lg" label="서비스 시작하기" />
      </div>
    </main>
  );
}
