import { ArrowRight } from "lucide-react";

import { IconBadge } from "@/shared/components/ui/IconBadge";
import { Tag } from "@/shared/components/ui/Tag";
import {
  STATUS_LABEL,
  STATUS_TAG_VARIANT,
  type ResultTimelineItem as ResultTimelineItemData,
} from "../../mocks/resultConfirmMock";

/**
 * 좌측 타임라인 한 항목. 변경 상태 뱃지 + 사유 설명 + 다음 장소까지 이동
 * 정보로 구성된다. 이 화면은 결과를 확인만 하는 화면이라(수정은 3단계
 * 결과편집에서 진행) 후보 재조회·수정 액션은 두지 않는다.
 */
export interface ResultTimelineItemProps {
  item: ResultTimelineItemData;
  isLast?: boolean;
}

export function ResultTimelineItem({
  item,
  isLast = false,
}: ResultTimelineItemProps) {
  const Icon = item.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <IconBadge variant={item.iconVariant} size="md" className="shrink-0">
          <Icon className="size-5" aria-hidden="true" />
        </IconBadge>
        {!isLast && <span className="my-1 w-px flex-1 bg-neutral-200" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-700">{item.time}</span>
          <Tag variant={STATUS_TAG_VARIANT[item.status]} size="sm">
            {STATUS_LABEL[item.status]}
          </Tag>
        </div>
        <p className="font-semibold text-neutral-900">{item.placeName}</p>
        {item.description && (
          <p className="text-sm text-neutral-700">{item.description}</p>
        )}

        {item.nextLegLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
            <ArrowRight className="size-3.5" aria-hidden="true" />
            {item.nextLegLabel}
          </div>
        )}
      </div>
    </div>
  );
}
