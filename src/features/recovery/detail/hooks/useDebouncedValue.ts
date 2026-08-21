import { useEffect, useState } from "react";

/**
 * 값이 변경된 후 일정 시간(delayMs)이 지나면
 * 변경된 값을 반환하는 디바운스 훅
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  // 디바운스가 적용된 값을 저장
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // 값이 변경되면 지정된 시간만큼 기다린 후 상태를 업데이트
    const timer = setTimeout(() => setDebounced(value), delayMs);

    // 새로운 값이 들어오기 전에 이전 타이머를 정리
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  // 지연 처리된 값을 반환
  return debounced;
}
