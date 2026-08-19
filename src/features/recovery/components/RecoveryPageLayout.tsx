import type { ReactNode } from "react";

import { Stepper, type StepperStep } from "@/shared/components/ui/Stepper";

export interface RecoveryPageLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  steps: StepperStep[];
  children: ReactNode;
}

export function RecoveryPageLayout({
  title,
  description,
  currentStep,
  steps,
  children,
}: RecoveryPageLayoutProps) {
  return (
    <section className="flex flex-1 flex-col py-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-700">{description}</p>
        </div>

        <div className="max-w-full overflow-x-auto pb-1">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </header>

      <div className="mt-8 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
