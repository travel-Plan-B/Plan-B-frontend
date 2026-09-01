import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SimpleRecoveryStartLink } from "@/features/recovery/simple/SimpleRecoveryStartLink";
import { ROUTES } from "@/shared/config/routes";

import { SectionHeading } from "./SectionHeading";

const recoveryTypes = [
  {
    title: "간편 복구",
    description:
      "문제 항목만 선택하면 AI가 빠르게 최적의 대체 일정을 제안해요.",
    feature: "하루 일정 · 빠른 일정 변경",
    cta: "간편 복구 시작",
    href: ROUTES.RECOVERY_SIMPLE,
    card: "border-primary-300 bg-primary-50",
    accent: "text-primary-600",
    button:
      "bg-primary-500 hover:bg-primary-600 focus-visible:ring-primary-500",
    image: "/images/home/mascot-mint.png",
    imageAlt: "지도를 들고 인사하는 Mint Plan B 마스코트",
  },
  {
    title: "상세 복구",
    description:
      "여행 스타일과 선호도를 반영해 전체 흐름을 고려한 최적 일정을 설계해요.",
    feature: "장기 여행 · 여러 일정 재구성",
    cta: "상세 복구 시작",
    href: ROUTES.RECOVERY_DETAIL,
    card: "border-purple-300 bg-purple-50",
    accent: "text-purple-600",
    button: "bg-purple-500 hover:bg-purple-600 focus-visible:ring-purple-500",
    image: "/images/home/mascot-purple.png",
    imageAlt: "여행 계획표를 들고 엄지를 든 Purple Plan B 마스코트",
  },
] as const;

export function RecoveryTypeSection() {
  return (
    <section
      className="mx-auto w-full max-w-320 px-6 pt-20 sm:px-12 sm:pt-24 xl:px-16"
      aria-labelledby="type-title"
    >
      <div id="type-title">
        <SectionHeading title="상황에 맞는 복구 방식을 선택하세요" />
      </div>
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        {recoveryTypes.map((type) => (
          <article
            key={type.title}
            className={`grid min-h-[320px] grid-cols-[80px_1fr] items-center gap-4 rounded-2xl border p-5 shadow-sm sm:min-h-[368px] sm:grid-cols-[120px_1fr] sm:gap-6 sm:p-9 lg:grid-cols-[150px_1fr] lg:p-8 xl:grid-cols-[190px_1fr] xl:p-10 ${type.card}`}
          >
            <Image
              src={type.image}
              alt={type.imageAlt}
              width={1254}
              height={1254}
              sizes="(max-width: 768px) 140px, (max-width: 1024px) 120px, (max-width: 1280px) 150px, 190px"
              className="h-auto w-full drop-shadow-md"
            />
            <div className="flex h-full min-w-0 flex-col justify-center">
              <h3 className={`text-3xl font-bold ${type.accent}`}>
                {type.title}
              </h3>
              <p className="mt-3 text-base leading-8 text-neutral-700 sm:mt-4">
                {type.description}
              </p>
              <span
                className={`mt-3 w-fit rounded-full border border-current bg-white/70 px-4 py-2 text-sm font-semibold sm:mt-5 ${type.accent}`}
              >
                {type.feature}
              </span>
              {type.href === ROUTES.RECOVERY_DETAIL && (
                <span className="mt-2 w-fit rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 sm:mt-3 lg:hidden">
                  PC 전용 · 1024px 이상
                </span>
              )}
              {type.href === ROUTES.RECOVERY_SIMPLE ? (
                <SimpleRecoveryStartLink
                  className={`mt-5 inline-flex min-h-16 items-center justify-center gap-2 rounded-xl px-7 text-base font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:mt-auto ${type.button}`}
                >
                  {type.cta}
                  <ArrowRight className="size-4" />
                </SimpleRecoveryStartLink>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex min-h-16 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-neutral-200 px-4 text-base font-semibold text-neutral-500 sm:mt-auto lg:hidden"
                  >
                    {type.cta}
                    <ArrowRight className="size-4" />
                  </button>
                  <Link
                    href={type.href}
                    className={`mt-5 hidden min-h-16 items-center justify-center gap-2 rounded-xl px-7 text-base font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:mt-auto lg:inline-flex ${type.button}`}
                  >
                    {type.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
