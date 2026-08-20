import { ArrowRight, Clock } from "lucide-react";

import { Tag, type TagVariant } from "@/shared/components/ui/Tag";
import { cn } from "@/shared/lib/cn";
import type { ChangedScheduleSide } from "../../mocks/resultEditMock";

/**
 * 좌측 상단 "변경 전 / 변경 후" 비교 카드. 상단 라벨/시간 배지, 하단 풀폭
 * 상태 배지 모두 공용 Tag 컴포넌트를 재사용하고, Tag 자체는 수정하지 않는다
 * (카드 바깥 테두리·배경만 이 화면 전용으로 커스텀).
 */
export type ChangeSummaryTone = "rose" | "purple";

const TONE_TAG_VARIANT: Record<ChangeSummaryTone, TagVariant> = {
  rose: "pink",
  purple: "purple",
};

const CARD_TONE_CLASS: Record<ChangeSummaryTone, string> = {
  rose: "border-rose-500 bg-rose-50",
  purple: "border-purple-500 bg-purple-50",
};

function ChangeSummaryCard({
  tone,
  side,
}: {
  tone: ChangeSummaryTone;
  side: ChangedScheduleSide;
}) {
  const tagVariant = TONE_TAG_VARIANT[tone];

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border p-4",
        CARD_TONE_CLASS[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Tag variant={tagVariant} size="sm" className="shrink-0 bg-white">
          {side.statusLabel}
        </Tag>
        <Tag
          variant="gray"
          size="sm"
          className="shrink-0 gap-1 border-0 bg-white text-neutral-700"
        >
          <Clock className="size-3" aria-hidden="true" />
          {side.time}
        </Tag>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-neutral-900">{side.title}</h3>
        <p className="mt-0.5 text-sm text-neutral-700">{side.description}</p>
      </div>

      <Tag
        variant={tagVariant}
        appearance="solid"
        size="lg"
        className="w-full justify-center py-2.5"
      >
        {side.bottomLabel}
      </Tag>
    </div>
  );
}

export interface ChangeSummaryCardsProps {
  previous: ChangedScheduleSide;
  recommended: ChangedScheduleSide;
}

export function ChangeSummaryCards({
  previous,
  recommended,
}: ChangeSummaryCardsProps) {
  return (
    <div className="flex items-stretch gap-2">
      <ChangeSummaryCard tone="rose" side={previous} />
      <ArrowRight
        className="my-auto size-5 shrink-0 text-neutral-400"
        aria-hidden="true"
      />
      <ChangeSummaryCard tone="purple" side={recommended} />
    </div>
  );
}
