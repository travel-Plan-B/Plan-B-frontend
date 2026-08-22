import { ShieldCheck } from "lucide-react";
import Image from "next/image";

import { RecoveryStartButton } from "./RecoveryStartButton";

export function FinalCTASection() {
  return (
    <section
      className="mx-auto mt-20 grid min-h-[440px] w-[calc(100%-3rem)] max-w-288 items-center gap-6 overflow-hidden rounded-[32px] border border-primary-300 bg-primary-50 p-8 sm:mt-24 sm:w-[calc(100%-6rem)] sm:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16 xl:w-[calc(100%-8rem)]"
      aria-labelledby="final-cta-title"
    >
      <div className="max-w-lg lg:py-8">
        <h2
          id="final-cta-title"
          className="text-[34px] font-extrabold leading-[1.2] tracking-tight text-neutral-900 sm:text-[36px]"
        >
          일정이 틀어져도,
          <br />
          여행은 다시 이어질 수 있어요.
        </h2>
        <RecoveryStartButton
          className="mt-9 bg-neutral-900 px-10 py-5 text-lg hover:bg-neutral-800"
          label="일정 복구 시작하기"
        />
        <p className="mt-5 flex items-center gap-2 text-sm text-neutral-600">
          <ShieldCheck className="size-4 text-primary-500" />
          로그인 없이 바로 시작
        </p>
      </div>
      <Image
        src="/images/home/final-cta-illustration.png"
        alt="자동차와 여행지, Plan B 마스코트가 이어진 복구 여행 경로"
        width={900}
        height={600}
        sizes="(max-width: 1024px) 90vw, 680px"
        className="mx-auto h-auto w-full max-w-2xl self-end lg:-translate-x-6 lg:scale-105 lg:self-center xl:-translate-x-8"
      />
    </section>
  );
}
