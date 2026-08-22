import { CalendarX2 } from "lucide-react";

import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";

import {
  IconBadge,
  type IconBadgeVariant,
} from "@/shared/components/ui/IconBadge";

import { SectionHeading } from "./SectionHeading";

const problems = [
  {
    title: "날씨 문제",
    lines: ["갑자기 비가 와", "야외 일정이 어려울 때"],
    imageIcon: rainIcon,
    style: "border-purple-300 bg-purple-25",
    badgeStyle: "bg-purple-100",
    badgeVariant: "purple" satisfies IconBadgeVariant,
  },
  {
    title: "장소 휴무",
    lines: ["도착했는데", "방문 장소가 쉬는 날일 때"],
    imageIcon: null,
    style: "border-rose-500 bg-rose-25",
    badgeStyle: "bg-rose-100",
    badgeVariant: "pink" satisfies IconBadgeVariant,
  },
  {
    title: "일정 지연",
    lines: ["일정이 밀려", "다음 장소에 가기 어려울 때"],
    imageIcon: clockIcon,
    style: "border-yellow-500 bg-yellow-25",
    badgeStyle: "bg-yellow-100",
    badgeVariant: "orange" satisfies IconBadgeVariant,
  },
] as const;

export function ProblemSection() {
  return (
    <section
      className="mx-auto w-full max-w-7xl px-6 pt-16 sm:pt-20"
      aria-labelledby="problem-title"
    >
      <div id="problem-title">
        <SectionHeading title="이런 상황에서 필요해요" />
      </div>
      <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
        {problems.map(
          ({ title, lines, imageIcon, style, badgeStyle, badgeVariant }) => (
            <article
              key={title}
              className={`flex min-h-48 items-center gap-7 rounded-2xl border p-8 shadow-sm lg:px-9 ${style}`}
            >
              {imageIcon ? (
                <IconBadge
                  className={`size-16 [&>span]:size-8 ${badgeStyle}`}
                  icon={imageIcon}
                  size="lg"
                  variant={badgeVariant}
                />
              ) : (
                <IconBadge
                  className={`size-16 ${badgeStyle}`}
                  size="lg"
                  variant={badgeVariant}
                >
                  <CalendarX2 className="size-8" strokeWidth={2.25} />
                </IconBadge>
              )}
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 text-base leading-8 text-neutral-700">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </p>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
