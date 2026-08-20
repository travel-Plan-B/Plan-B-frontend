import type { StepperStep } from "@/shared/components/ui/Stepper";

export const DETAIL_RECOVERY_STEPS = [
  { label: "기존 일정 입력" },
  { label: "조건 설정" },
  { label: "결과편집" },
  { label: "최종일정" },
] satisfies StepperStep[];
