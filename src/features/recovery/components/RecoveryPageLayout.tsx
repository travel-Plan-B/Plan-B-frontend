import type { ReactNode } from "react";

import { Stepper, type StepperStep } from "@/shared/components/ui/Stepper";

const RECOVERY_STEPS = [
  { label: "기본 상황 입력" },
  { label: "조건 설정" },
  { label: "결과편집" },
  { label: "최종일정" },
] satisfies StepperStep[];

export interface RecoveryPageLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  children: ReactNode;
}

export function RecoveryPageLayout({
  title,
  description,
  currentStep,
  children,
}: RecoveryPageLayoutProps) {
  return (
    <section className="flex flex-1 flex-col py-12">
      <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          <p className="text-base text-neutral-700">{description}</p>
        </div>

        <div className="max-w-full overflow-x-auto pb-2">
          <Stepper steps={RECOVERY_STEPS} currentStep={currentStep} />
        </div>
      </header>

      <div className="mt-12 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
