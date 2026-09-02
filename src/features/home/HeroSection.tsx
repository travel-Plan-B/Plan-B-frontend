import { Check, Footprints, Sparkles } from "lucide-react";
import Image from "next/image";

import { HeroRouteOverlay } from "./HeroRouteOverlay";
import { RecoveryStartButton } from "./RecoveryStartButton";
import { StatusMark } from "@/shared/components/ui/StatusMark";

const recoveredSchedule = [
  { time: "07:00", title: "호텔 조식", active: false },
  { time: "08:30", title: "바다 전망 카페", active: true },
  { time: "11:00", title: "해안 산책로", active: false },
  { time: "13:00", title: "로컬 점심", active: false },
] as const;

function HeroProblemCard() {
  return (
    <article className="absolute left-[43%] top-16 w-60 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
        문제 발생
      </span>
      <p className="mt-3 flex items-center gap-3 text-sm text-neutral-900">
        <strong>08:00</strong>
        <span>전망대 방문</span>
        <span className="text-rose-600">/ 휴무</span>
      </p>
    </article>
  );
}

function HeroRecoveredSchedule() {
  return (
    <article className="absolute right-12 top-12 w-72 rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg">
      <span className="inline-flex rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
        복구 완료
      </span>
      <ol className="relative mt-4 space-y-1 before:absolute before:bottom-3 before:left-1 before:top-3 before:w-px before:bg-neutral-200">
        {recoveredSchedule.map((item) => (
          <li
            key={item.time}
            className={`relative flex min-h-10 items-center rounded-xl pl-6 pr-3 text-xs ${item.active ? "bg-primary-50 text-primary-700" : "text-neutral-800"}`}
          >
            <span
              className={`absolute left-0 z-10 size-2 rounded-full ${item.active ? "bg-primary-500" : "bg-neutral-200"}`}
            />
            <time className="w-14 text-neutral-600">{item.time}</time>
            <span className="font-semibold">{item.title}</span>
            {item.active && (
              <StatusMark status="success" className="ml-auto size-5" />
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

function HeroRecommendationCard() {
  return (
    <article className="absolute bottom-10 left-[42%] flex w-80 gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <Image
        src="/images/home/hero-cafe-seaside.png"
        alt="창가에서 바다를 바라볼 수 있는 카페"
        width={96}
        height={96}
        className="size-24 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 py-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary-600">
          <Sparkles className="size-4" /> 대안 추천
        </p>
        <p className="mt-2 text-sm font-bold text-neutral-900">08:30</p>
        <p className="mt-1 truncate text-base font-bold text-neutral-900">
          바다 전망 카페
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-600">
          <Footprints className="size-4" /> 도보 7분
        </p>
      </div>
    </article>
  );
}

export function HeroSection() {
  return (
    <section
      className="w-full overflow-hidden bg-white"
      aria-labelledby="hero-title"
    >
      <div className="relative mx-auto min-h-160 w-full max-w-320 overflow-hidden lg:h-180">
        <Image
          src="/images/home/hero-map-clean.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/15 md:via-white/70 md:to-transparent"
          aria-hidden="true"
        />
        <HeroRouteOverlay />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-20 bg-gradient-to-l from-white/90 via-white/50 to-transparent md:w-28"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          <HeroProblemCard />
          <HeroRecoveredSchedule />
          <HeroRecommendationCard />
          <Image
            src="/images/home/mascot-mint.png"
            alt="여행 일정을 복구하는 Plan B 마스코트"
            width={1254}
            height={1254}
            priority
            className="absolute bottom-6 right-12 h-auto w-40 drop-shadow-lg"
          />
        </div>

        <div className="relative z-20 flex min-h-160 items-center px-6 py-16 sm:px-12 lg:h-180 xl:px-16">
          <div className="max-w-md rounded-2xl bg-white/60 px-4 py-6 backdrop-blur-[2px] sm:p-8 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <h1
              id="hero-title"
              className="text-[30px] font-extrabold leading-[1.35] tracking-[-.035em] text-neutral-900 sm:text-[38px] sm:leading-[1.3]"
            >
              여행의 흐름이 끊겨도,
              <br />
              <span className="text-primary-500">Plan B</span>가 다시{" "}
              <span className="whitespace-nowrap">이어드려요.</span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-neutral-700">
              날씨, 휴무, 일정 지연으로 틀어진 일정에서
              <br className="hidden sm:block" /> 변경이 필요한 부분만 AI가
              빠르게 복구해드려요.
            </p>
            <RecoveryStartButton className="mt-8" label="서비스 시작" />
            <p className="mt-5 flex items-center gap-2 text-xs text-neutral-700">
              <Check className="size-4 text-primary-500" />
              원본 일정은 그대로, 필요한 부분만 똑똑하게 복구
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
