import { cn } from "@/shared/lib/cn";
import {
  STATUS_LABEL,
  type RecoverySummaryCount,
  type ResultStatus,
} from "../../mocks/resultConfirmMock";

const DOT_COLOR: Record<ResultStatus, string> = {
  unchanged: "bg-neutral-500",
  placeChanged: "bg-primary-500",
  timeChanged: "bg-purple-400",
};

/** 우측 "이번 복구 결과" 요약 카드: 상태별 건수. */
export interface RecoverySummaryCardProps {
  counts: RecoverySummaryCount[];
}

export function RecoverySummaryCard({ counts }: RecoverySummaryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <h2 className="font-semibold text-neutral-900">이번 복구 결과</h2>
      <ul className="flex flex-col gap-2">
        {counts.map(({ status, count }) => (
          <li
            key={status}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-neutral-700">
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", DOT_COLOR[status])}
              />
              {STATUS_LABEL[status]}
            </span>
            <span className="font-semibold text-neutral-900">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
