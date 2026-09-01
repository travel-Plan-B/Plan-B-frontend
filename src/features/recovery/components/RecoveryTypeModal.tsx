"use client";

import { Check, SlidersHorizontal, Zap } from "lucide-react";
import Link from "next/link";

import { SimpleRecoveryStartLink } from "@/features/recovery/simple/SimpleRecoveryStartLink";
import { Modal } from "@/shared/components/ui/Modal/Modal";
import { ROUTES } from "@/shared/config/routes";

export interface RecoveryTypeModalProps {
  open: boolean;
  onClose: () => void;
}

const recoveryTypes = [
  {
    type: "simple",
    title: "심플 리커버리",
    description: "틀어진 단일 일정만 빠르게 교체",
    features: [
      "단일 일정 항목을 신속하게 대체",
      "복잡한 설정 없이 최소한의 입력",
      "문제가 생긴 기존 장소의 대체 일정 추천",
    ],
    href: ROUTES.RECOVERY_SIMPLE,
    buttonText: "심플 리커버리 시작",
  },
  {
    type: "detail",
    title: "디테일 리커버리",
    description: "여러 일정과 전체 동선을 조건에 맞춰 재구성",
    features: [
      "여러 일정 항목을 조건에 맞춰 교체",
      "시간·예산·테마별 세부 조건 설정",
      "전체 이동 경로 및 타임라인 정밀 편집",
    ],
    href: ROUTES.RECOVERY_DETAIL,
    buttonText: "디테일 리커버리 시작",
  },
] as const;

export function RecoveryTypeModal({ open, onClose }: RecoveryTypeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="recovery-type-title"
      className="max-w-3xl rounded-2xl p-6 sm:p-8 md:p-9 shadow-xl"
    >
      <header className="text-center">
        <h2
          id="recovery-type-title"
          className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl"
        >
          어떤 방식으로 복구를 원하시나요?
        </h2>

        <p className="mt-2 text-xs font-normal text-neutral-600 sm:text-sm">
          여행 상황과 필요에 알맞은 복구 방식을 선택해 주세요.
        </p>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {recoveryTypes.map((type) => {
          const isSimple = type.type === "simple";
          const Icon = isSimple ? Zap : SlidersHorizontal;

          return (
            <article
              key={type.type}
              className={[
                "group relative flex min-h-[320px] flex-col justify-between rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[350px]",
                isSimple
                  ? "border-primary-400 bg-primary-25/80 hover:border-primary-500"
                  : "border-purple-400 bg-purple-50/60 hover:border-purple-500",
              ].join(" ")}
            >
              <div>
                {/* 카드 헤더: 아이콘 + 타이틀/설명 */}
                <div className="flex items-center gap-4">
                  <div
                    className={[
                      "flex size-13 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-200 ",
                      isSimple
                        ? "border-primary-300 bg-primary-50 text-primary-600"
                        : "border-purple-300 bg-purple-50 text-purple-600",
                    ].join(" ")}
                  >
                    <Icon className="size-6 stroke-[2.2]" />
                  </div>

                  <div>
                    <h3
                      className={[
                        "text-lg font-bold tracking-tight",
                        isSimple ? "text-primary-700" : "text-purple-700",
                      ].join(" ")}
                    >
                      {type.title}
                    </h3>

                    <p className="mt-0.5 text-xs text-neutral-600">
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* 특징 리스트: 항목 간 세로 간격(높낮이) 확대 */}
                <ul className="mt-7 space-y-4">
                  {type.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-xs font-medium text-neutral-800 sm:text-sm"
                    >
                      <span
                        className={[
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-white shadow-2xs",
                          isSimple ? "bg-primary-500" : "bg-purple-600",
                        ].join(" ")}
                      >
                        <Check className="size-3 stroke-[3]" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {!isSimple && (
                  <span className="mt-5 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 lg:hidden">
                    PC 전용 · 1024px 이상
                  </span>
                )}
              </div>

              {/* 액션 CTA 버튼: 둘 다 색상 채워진 Solid 버튼 */}
              {isSimple ? (
                <SimpleRecoveryStartLink
                  onClick={onClose}
                  className={[
                    "mt-8 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500",
                  ].join(" ")}
                >
                  {type.buttonText}
                </SimpleRecoveryStartLink>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="mt-8 flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-neutral-200 text-sm font-semibold text-neutral-500 lg:hidden"
                  >
                    {type.buttonText}
                  </button>
                  <Link
                    href={type.href}
                    onClick={onClose}
                    className={[
                      "mt-8 hidden h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:flex",
                      "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 focus-visible:ring-purple-600",
                    ].join(" ")}
                  >
                    {type.buttonText}
                  </Link>
                </>
              )}
            </article>
          );
        })}
      </div>
    </Modal>
  );
}
