import { ArrowDown, ArrowRight, Check, X } from "lucide-react";

import { SectionHeading } from "./SectionHeading";

const before = [
  { time: "07:00", title: "호텔 조식" },
  { time: "08:00", title: "전망대 방문 / 휴무", changed: true },
  { time: "11:00", title: "해안 산책로" },
  { time: "13:00", title: "로컬 점심" },
];
const after = [
  { time: "07:00", title: "호텔 조식" },
  { time: "08:30", title: "바다 전망 카페", changed: true },
  { time: "11:00", title: "해안 산책로" },
  { time: "13:00", title: "로컬 점심" },
];

function ScheduleCard({
  type,
  items,
}: {
  type: "before" | "after";
  items: typeof before;
}) {
  const isBefore = type === "before";
  return (
    <article className="min-h-[360px] rounded-2xl border border-neutral-200 bg-white p-8 shadow-md sm:p-10">
      <p
        className={`mb-6 text-base font-bold ${isBefore ? "text-rose-600" : "text-primary-600"}`}
      >
        {isBefore ? "복구 전" : "복구 후"}
      </p>
      <ol className="space-y-2">
        {items.map((item) => (
          <li
            key={item.time}
            className={`flex min-h-16 items-center rounded-xl px-4 text-base lg:px-5 lg:text-lg ${item.changed ? (isBefore ? "bg-rose-50 text-rose-600" : "bg-primary-50 text-primary-700") : "text-neutral-800"}`}
          >
            <span className="w-20 text-sm text-neutral-600 lg:w-24 lg:text-base">
              {item.time}
            </span>
            <span className="font-medium">{item.title}</span>
            {item.changed && (
              <span
                className={`ml-auto grid size-6 place-items-center rounded-full text-white ${isBefore ? "bg-rose-500" : "bg-primary-500"}`}
              >
                {isBefore ? (
                  <X className="size-4" />
                ) : (
                  <Check className="size-4" />
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

export function RecoveryComparisonSection() {
  return (
    <section
      className="mx-auto w-full max-w-320 px-6 pt-20 sm:px-12 sm:pt-24 xl:px-16"
      aria-labelledby="comparison-title"
    >
      <div className="rounded-3xl bg-neutral-50 px-6 py-10 sm:px-8 sm:py-12">
        <div id="comparison-title">
          <SectionHeading title="문제 일정만 바꿔도 여행은 계속됩니다" />
        </div>
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <ScheduleCard type="before" items={before} />
          <div className="grid place-items-center text-neutral-500">
            <ArrowRight className="hidden size-12 lg:block" />
            <ArrowDown className="size-9 lg:hidden" />
          </div>
          <ScheduleCard type="after" items={after} />
        </div>
        <p className="mt-7 text-center text-base text-neutral-600">
          전체 일정은 그대로 유지하고, 문제가 생긴 일정만 적합한 대안으로
          변경해요.
        </p>
      </div>
    </section>
  );
}
