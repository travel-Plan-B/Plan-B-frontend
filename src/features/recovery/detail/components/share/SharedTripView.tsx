"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/shared/config/routes";
import { decodeSharePayload, fromShareDays } from "../../lib/shareEncode";
import { AppliedConditionsCard } from "../result-confirm/AppliedConditionsCard";
import { RecoverySummaryCard } from "../result-confirm/RecoverySummaryCard";
import { ResultTimelinePanel } from "../result-confirm/ResultTimelinePanel";
import { TripSummaryPill } from "../result-confirm/TripSummaryPill";

/**
 * "일정 공유하기"/"복사"로 나온 링크를 열었을 때 보이는 읽기 전용 화면.
 * 백엔드 저장 없이 URL의 `d` 쿼리에 인코딩된 값만 디코딩해서 그리므로,
 * 링크를 만든 시점 이후의 변경 사항은 반영되지 않는다(#118).
 */
export function SharedTripView({ token }: { token: string | undefined }) {
  const payload = token ? decodeSharePayload(token) : null;

  if (!payload) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          링크가 올바르지 않아요
        </p>
        <p className="text-sm text-neutral-600">
          링크가 손상되었거나 잘못 전달된 것 같아요. 공유한 사람에게 링크를 다시
          받아보세요.
        </p>
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Plan B 홈으로 가기
        </Link>
      </div>
    );
  }

  const days = fromShareDays(payload.days);

  return (
    <section className="flex flex-1 flex-col gap-8 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          공유된 여행 일정이에요
        </h1>
        <p className="text-sm text-neutral-700">
          다른 사람이 Plan B로 복구한 일정을 공유했어요.
        </p>
      </div>

      <TripSummaryPill
        tripSummary={{
          region: payload.region,
          dateRangeLabel: payload.dateRangeLabel,
          nightsLabel: payload.nightsLabel,
        }}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ResultTimelinePanel days={days} />

        <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <RecoverySummaryCard counts={payload.summary} />
          <AppliedConditionsCard conditions={payload.conditions} />
        </div>
      </div>

      <div className="flex justify-center">
        <Link
          href={ROUTES.RECOVERY_DETAIL}
          className="inline-flex h-14 w-70 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-base font-medium text-white hover:opacity-90"
        >
          <MapPin className="size-4" aria-hidden="true" />내 여행도 복구해보기
        </Link>
      </div>
    </section>
  );
}
