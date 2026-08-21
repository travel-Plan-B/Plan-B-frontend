import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// StrictMode에서 effect가 두 번 실행돼도 worker.start()가 한 번만 불리도록 메모이즈한다.
let startPromise: ReturnType<typeof worker.start> | null = null;
export function startMockWorker(): ReturnType<typeof worker.start> {
  if (startPromise === null) {
    startPromise = worker.start({ onUnhandledRequest: "bypass" });
  }
  return startPromise;
}
