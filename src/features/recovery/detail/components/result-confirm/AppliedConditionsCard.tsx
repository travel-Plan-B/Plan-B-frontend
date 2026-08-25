import type { LucideIcon } from "lucide-react";
import { SlidersHorizontal } from "lucide-react";
import Image, { type StaticImageData } from "next/image";

import { Tag } from "@/shared/components/ui/Tag";
import type { AppliedCondition } from "../../mocks/resultConfirmMock";

function isImageIcon(
  icon: LucideIcon | StaticImageData,
): icon is StaticImageData {
  return typeof icon === "object" && "src" in icon;
}

/** 우측 "적용한 복구 조건" 카드: 2단계에서 선택한 공통 조건 요약. */
export interface AppliedConditionsCardProps {
  conditions: AppliedCondition[];
}

export function AppliedConditionsCard({
  conditions,
}: AppliedConditionsCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
      <h2 className="flex items-center justify-between font-semibold text-neutral-900">
        적용한 복구 조건
        <SlidersHorizontal
          className="size-4 text-neutral-600"
          aria-hidden="true"
        />
      </h2>
      <div className="flex flex-wrap gap-2">
        {conditions.map((condition) => (
          <Tag
            key={condition.label}
            variant={condition.variant}
            size="md"
            className="gap-1"
          >
            {condition.icon &&
              (isImageIcon(condition.icon) ? (
                <Image src={condition.icon} alt="" className="size-3.5" />
              ) : (
                <condition.icon className="size-3.5" aria-hidden="true" />
              ))}
            {condition.label}
          </Tag>
        ))}
      </div>
    </div>
  );
}
