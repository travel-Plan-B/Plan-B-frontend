import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// React Strict Mode(dev)는 effect를 두 번 실행해서 worker.start()도 두 번
// 호출될 수 있다. 이미 시작 중/완료된 Promise를 재사용해 중복 호출을 막는다.
let startPromise: ReturnType<typeof worker.start> | null = null;

export function startWorker() {
  startPromise ??= worker.start({ onUnhandledRequest: "bypass" });
  return startPromise;
}
