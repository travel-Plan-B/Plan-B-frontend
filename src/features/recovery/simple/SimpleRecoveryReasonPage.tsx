"use client";

import { useState } from "react";
import { CalendarX } from "lucide-react";

import clockIcon from "@/shared/assets/icons/clock.svg";
import rainIcon from "@/shared/assets/icons/rain.svg";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { RecoveryTypeCard } from "@/features/recovery/components/RecoveryTypeCard";
import { Button } from "@/shared/components/ui/Button";
import { IconBadge } from "@/shared/components/ui/IconBadge";

type RecoveryReason = "weather" | "closed" | "delay";

const RECOVERY_REASONS = [
  {
    value: "weather",
    icon: rainIcon,
    title: "날씨가 변했어요",
    description:
      "비가 오거나, 너무 덥거나, 춥거나 혹은 야외 일정을 계속하기 어려운 날씨입니다.",
    example: "근처 실내 장소 찾기",
  },
  {
    value: "closed",
    icon: null,
    title: "장소 휴무",
    description:
      "목적지가 폐쇄되었거나, 예약이 찼거나 일시적으로 이용할 수 없는 상태입니다.",
    example: "유사한 대안 장소 찾기",
  },
  {
    value: "delay",
    icon: clockIcon,
    title: "일정 지연",
    description:
      "이동이나 일정이 지연되어 예정된 장소를 방문하기 어려운 상태입니다.",
    example: "더 가까운 장소 찾기",
  },
] satisfies Array<{
  value: RecoveryReason;
  icon: typeof rainIcon | null;
  title: string;
  description: string;
  example: string;
}>;

export function SimpleRecoveryReasonPage() {
  const [selectedReason, setSelectedReason] = useState<RecoveryReason | null>(
    null,
  );

  return (
    <RecoveryPageLayout
      title="다음 일정에 어떤 문제가 생겼나요?"
      description="다음 목적지를 변경해야 하는 이유를 가장 잘 설명하는 상황을 선택해 주세요"
      currentStep={1}
    >
      <div
        role="group"
        aria-label="복구 문제 유형"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {RECOVERY_REASONS.map((reason) => {
          const isSelected = selectedReason === reason.value;

          return (
            <RecoveryTypeCard
              key={reason.value}
              icon={
                reason.icon ? (
                  <IconBadge
                    icon={reason.icon}
                    variant={isSelected ? "mint" : "gray"}
                    size="lg"
                    className="size-18 [&>span]:size-9"
                  />
                ) : (
                  <IconBadge
                    variant={isSelected ? "mint" : "gray"}
                    size="lg"
                    className="size-18 [&>svg]:size-9"
                  >
                    <CalendarX strokeWidth={1.75} />
                  </IconBadge>
                )
              }
              title={reason.title}
              description={reason.description}
              example={reason.example}
              selected={isSelected}
              onClick={() => setSelectedReason(reason.value)}
              className="h-auto min-h-80 w-full lg:h-100"
            />
          );
        })}
      </div>

      <div className="mt-12 flex justify-end">
        <Button variant="default" size="lg" disabled={!selectedReason}>
          다음으로 넘어가기
        </Button>
      </div>
    </RecoveryPageLayout>
  );
}
