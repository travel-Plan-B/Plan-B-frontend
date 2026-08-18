import { Stepper, type StepperStep } from "@/shared/components/ui/Stepper";

const STEPS: StepperStep[] = [
  { label: "기존 일정 입력" },
  { label: "조건 설정" },
  { label: "결과편집" },
  { label: "최종일정" },
];

export interface StepHeaderProps {
  currentStep: number;
  title: string;
  description: string;
}

// 디테일모드 단계별 화면 상단 공통 헤더. 단계마다 title/description만 바뀌고
// Stepper 구성(STEPS)은 모든 단계에서 동일하게 공유한다.
export function StepHeader({
  currentStep,
  title,
  description,
}: StepHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-6 items-center">
        <h1 className="text-fluid-xl font-bold text-neutral-900">{title}</h1>
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          size="sm"
          className="shrink-0"
        />
      </div>

      <p className="text-fluid-sm text-neutral-700">{description}</p>
    </div>
  );
}
