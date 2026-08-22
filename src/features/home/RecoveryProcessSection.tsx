import { CalendarCheck2, CalendarX2, Scale } from "lucide-react";

import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    step: 1,
    title: "문제 일정 선택",
    description: "변경이 필요한 일정을 선택해요",
    icon: CalendarX2,
    color: "bg-rose-50 text-rose-600",
    badge: "bg-rose-500",
  },
  {
    step: 2,
    title: "추천 후보 비교",
    description: "AI가 제안한 대안을 비교해요",
    icon: Scale,
    color: "bg-primary-50 text-primary-600",
    badge: "bg-primary-500",
  },
  {
    step: 3,
    title: "일정에 적용",
    description: "원하는 일정을 기존 계획에 적용해요",
    icon: CalendarCheck2,
    color: "bg-yellow-50 text-yellow-700",
    badge: "bg-yellow-500",
  },
] as const;

export function RecoveryProcessSection() {
  return (
    <section
      className="mx-auto w-full max-w-320 px-6 pt-20 sm:px-12 sm:pt-24 xl:px-16"
      aria-labelledby="process-title"
    >
      <div id="process-title">
        <SectionHeading title="복구는 이렇게 진행돼요" />
      </div>
      <ol className="relative mx-auto grid max-w-4xl gap-8 md:grid-cols-3 md:gap-6">
        <span
          className="absolute left-[16.667%] right-[16.667%] top-5 hidden h-px bg-neutral-200 md:block"
          aria-hidden="true"
        />
        {steps.map(({ step, title, description, icon: Icon, color, badge }) => (
          <li
            key={step}
            className="relative z-10 flex min-h-64 flex-col items-center px-6 pb-6 text-center"
          >
            <span
              className={`grid size-10 place-items-center rounded-full text-base font-bold text-white ${badge}`}
            >
              {step}
            </span>
            <span
              className={`mt-5 grid size-20 place-items-center rounded-2xl ${color}`}
            >
              <Icon className="size-10" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-neutral-900">{title}</h3>
            <p className="mt-2 max-w-xs text-base leading-7 text-neutral-700">
              {description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
