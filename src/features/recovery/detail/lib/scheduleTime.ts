import type { TimePickerValue } from "@/shared/components/ui/TimePicker";

/**
 * 방문 시간과 체류 시간에 사용하는 TimePicker 옵션과
 * 문자열 ↔ TimePickerValue 변환 로직을 관리한다.
 *
 * ScheduleItemRow(1단계)와 ScheduleResultItemRow(3단계)에서
 * 동일한 시간 선택 규칙을 사용하므로 공통으로 분리한다.
 */

/** 방문 시간: 00시 ~ 23시 */
export const VISIT_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: String(hour).padStart(2, "0"),
}));

/** 방문 분: 10분 단위로 선택 */
export const VISIT_MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));

/** 체류 시간: 0시간 ~ 3시간 */
export const STAY_HOUR_OPTIONS = Array.from({ length: 4 }, (_, hour) => ({
  value: hour,
  label: `${hour}시간`,
}));

/** 체류 분: 0분 또는 30분 단위로 선택 */
export const STAY_MINUTE_OPTIONS = [0, 30].map((minute) => ({
  value: minute,
  label: `${minute}분`,
}));

/**
 * "HH:mm" 형태의 방문 시간 문자열을
 * TimePicker에서 사용하는 { hour, minute } 형태로 변환한다.
 */
export function parseVisitTime(value: string): TimePickerValue {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/**
 * "2시간 30분" 형태의 체류 시간 문자열을
 * TimePicker에서 사용하는 { hour, minute } 형태로 변환한다.
 */
export function parseStayDuration(value: string): TimePickerValue {
  const hour = Number(/(\d+)시간/.exec(value)?.[1] ?? 0);
  const minute = Number(/(\d+)분/.exec(value)?.[1] ?? 0);
  return { hour, minute };
}

/**
 * TimePicker의 시간/분 값을
 * 화면에 표시할 수 있는 체류 시간 문자열로 변환한다.
 *
 * 예:
 * - 2시간 0분 → "2시간"
 * - 0시간 30분 → "30분"
 * - 2시간 30분 → "2시간 30분"
 */
export function formatStayDuration({ hour, minute }: TimePickerValue): string {
  if (hour === 0) return `${minute}분`;
  if (minute === 0) return `${hour}시간`;
  return `${hour}시간 ${minute}분`;
}
