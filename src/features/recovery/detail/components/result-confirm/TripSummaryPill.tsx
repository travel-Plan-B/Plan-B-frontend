import { MapPin } from "lucide-react";

import type { TripSummary } from "../../lib/resultConfirmBuild";

/** 4단계 완료 화면과 공유 보기 화면이 함께 쓰는 "지역 | 기간 | 박일수" 요약 pill. */
export function TripSummaryPill({ tripSummary }: { tripSummary: TripSummary }) {
  return (
    <div className="inline-flex items-center gap-2 self-center rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-md">
      <MapPin className="size-4 text-primary-500" aria-hidden="true" />
      <span className="font-semibold text-neutral-900">
        {tripSummary.region}
      </span>
      <span className="text-neutral-300">|</span>
      {tripSummary.dateRangeLabel}
      <span className="text-neutral-300">|</span>
      {tripSummary.nightsLabel}
    </div>
  );
}
