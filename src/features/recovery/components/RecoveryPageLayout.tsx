import type { ReactNode } from "react";

import { Stepper, type StepperStep } from "@/shared/components/ui/Stepper";
import { cn } from "@/shared/lib/cn";

export interface RecoveryPageLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  steps: StepperStep[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  headingClassName?: string;
}

export function RecoveryPageLayout({
  title,
  description,
  currentStep,
  steps,
  children,
  className,
  contentClassName,
  headerClassName,
  headingClassName,
}: RecoveryPageLayoutProps) {
  return (
    <section className={cn("flex flex-1 flex-col py-8", className)}>
      <header
        className={cn(
          "flex flex-wrap items-start justify-between gap-x-6 gap-y-4",
          headerClassName,
        )}
      >
        <div
          className={cn(
            "flex min-w-0 max-w-xl flex-1 flex-col gap-2",
            headingClassName,
          )}
        >
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-700">{description}</p>
        </div>

        <Stepper steps={steps} currentStep={currentStep} />
      </header>

      <div className={cn("mt-8 flex flex-1 flex-col", contentClassName)}>
        {children}
      </div>
    </section>
  );
}
