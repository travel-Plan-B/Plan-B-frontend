import { Check } from "lucide-react";

import { cn } from "@/shared/lib/cn";

// 단계 하나를 나타낸다. 아이콘/번호는 status에 따라 컴포넌트가 자동으로 결정하므로
// 여기서는 라벨 텍스트만 받는다.
export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  // 1부터 시작하는 현재 단계 번호. 이 번호보다 작은 단계는 완료, 같으면 현재,
  // 크면 예정으로 자동 계산된다.
  currentStep: number;
  className?: string;
}

// design-system.md의 Progress Stepper 상태(완료/현재/예정)에 대응.
type StepStatus = "completed" | "current" | "upcoming";

// currentStep과 비교해서 각 단계의 상태를 계산한다.
// (완료/현재는 스타일이 같아서 컴포넌트 안에서는 isActive로 다시 합쳐서 쓴다.)
function getStepStatus(stepNumber: number, currentStep: number): StepStatus {
  if (stepNumber < currentStep) return "completed";
  if (stepNumber === currentStep) return "current";
  return "upcoming";
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => {
        // steps 배열은 0부터 시작하지만 단계 번호는 1부터 시작하므로 +1.
        const stepNumber = index + 1;
        const status = getStepStatus(stepNumber, currentStep);
        // 완료/현재는 Figma상 색상이 동일(Primary 500 배경 + 흰 텍스트)이라
        // 스타일 분기에서는 둘을 하나로 합쳐서 쓴다. 아이콘(체크 vs 숫자)만
        // status로 따로 구분한다.
        const isActive = status !== "upcoming";
        // 마지막 단계 뒤에는 연결선을 그리지 않는다.
        const isLast = stepNumber === steps.length;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              {/* 원형 단계 표시: 32px 고정 크기(size-8), 완전한 원(rounded-full). */}
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "border border-neutral-400 bg-white text-neutral-700",
                )}
              >
                {/* 완료된 단계만 체크 아이콘, 나머지(현재/예정)는 단계 번호를 보여준다. */}
                {status === "completed" ? (
                  <Check className="size-4" />
                ) : (
                  stepNumber
                )}
              </span>
              {/* 단계 이름. 완료/현재는 진한 텍스트, 예정은 흐린 텍스트로 구분. */}
              <span
                className={cn(
                  "text-tiny font-bold whitespace-nowrap",
                  isActive ? "text-neutral-800" : "text-neutral-400",
                )}
              >
                {step.label}
              </span>
            </div>
            {/* 단계 사이 연결선. 마지막 단계에는 렌더링하지 않는다. */}
            {!isLast && <div className="mx-2 h-px w-8 bg-neutral-400" />}
          </div>
        );
      })}
    </div>
  );
}
