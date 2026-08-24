import type { TimePickerValue } from "@/shared/components/ui/TimePicker";

/**
 * 방문 시간/체류 시간 TimePicker 옵션·파싱·포맷. ScheduleItemRow(1단계)와
 * ScheduleResultItemRow(3단계)가 똑같은 TimePicker를 쓰길래 여기로 모았다.
 */
export const VISIT_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: String(hour).padStart(2, "0"),
}));
export const VISIT_MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, "0"),
}));
export const STAY_HOUR_OPTIONS = Array.from({ length: 4 }, (_, hour) => ({
  value: hour,
  label: `${hour}시간`,
}));
export const STAY_MINUTE_OPTIONS = [0, 30].map((minute) => ({
  value: minute,
  label: `${minute}분`,
}));

export function parseVisitTime(value: string): TimePickerValue {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

export function parseStayDuration(value: string): TimePickerValue {
  const hour = Number(/(\d+)시간/.exec(value)?.[1] ?? 0);
  const minute = Number(/(\d+)분/.exec(value)?.[1] ?? 0);
  return { hour, minute };
}

export function formatStayDuration({ hour, minute }: TimePickerValue): string {
  if (hour === 0) return `${minute}분`;
  if (minute === 0) return `${hour}시간`;
  return `${hour}시간 ${minute}분`;
}
