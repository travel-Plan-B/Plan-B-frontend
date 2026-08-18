import type { StepperStep } from "@/shared/components/ui/Stepper";

export const SIMPLE_RECOVERY_STEPS = [
  { label: "상황 설정" },
  { label: "정보 입력" },
  { label: "AI 추천" },
] satisfies StepperStep[];
