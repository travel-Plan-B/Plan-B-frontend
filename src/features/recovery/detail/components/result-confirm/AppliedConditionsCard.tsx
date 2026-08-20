import { Tag } from "@/shared/components/ui/Tag";
import type { AppliedCondition } from "../../mocks/resultConfirmMock";

/** 우측 "적용한 복구 조건" 카드: 2단계에서 선택한 조건 요약(목업 값). */
export interface AppliedConditionsCardProps {
  conditions: AppliedCondition[];
}

export function AppliedConditionsCard({
  conditions,
}: AppliedConditionsCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <h2 className="font-semibold text-neutral-900">적용한 복구 조건</h2>
      <div className="flex flex-wrap gap-2">
        {conditions.map((condition) => (
          <Tag key={condition.label} variant={condition.variant} size="md">
            {condition.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
