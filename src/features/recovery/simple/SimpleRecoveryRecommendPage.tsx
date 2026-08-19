import { ArrowRight } from "lucide-react";

import { ScheduleCard } from "@/features/recommendation/components/ScheduleCard";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { Button } from "@/shared/components/ui/Button";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { Tag, type TagVariant } from "@/shared/components/ui/Tag";

import { RecommendationExplorer } from "./RecommendationExplorer";
import type { RecoveryConditionType } from "./recommendation-data";
import {
  changedSchedule,
  INITIAL_RECOMMENDATION_ID,
  recommendations,
  recoveryConditions,
} from "./recommendation-data";
import { SIMPLE_RECOVERY_STEPS } from "./steps";

const recoveryConditionVariant: Record<RecoveryConditionType, TagVariant> = {
  target: "mint",
  weather: "purple",
  travelTime: "orange",
};

export function SimpleRecoveryRecommendPage() {
  return (
    <RecoveryPageLayout
      title="추천 결과"
      description="현재 상황과 여행 취향을 반영해 가장 적합한 대체 일정을 찾았어요."
      currentStep={3}
      steps={SIMPLE_RECOVERY_STEPS}
    >
      <div className="flex flex-wrap items-center gap-2">
        {recoveryConditions.map((condition) => (
          <Tag
            key={condition.type}
            variant={recoveryConditionVariant[condition.type]}
            size="md"
          >
            {condition.label}
          </Tag>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="schedule-change-title">
        <h2
          id="schedule-change-title"
          className="text-2xl font-semibold text-neutral-900"
        >
          일정 변경 내역
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          문제가 생긴 일정을 새로운 장소로 교체했어요.
        </p>

        <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <ScheduleCard
            tone="rose"
            label="기존 일정"
            {...changedSchedule.previous}
          />
          <IconBadge
            variant="gray"
            size="md"
            className="mx-auto rotate-90 md:rotate-0"
          >
            <ArrowRight className="size-5" />
          </IconBadge>
          <ScheduleCard
            tone="purple"
            label="추천 일정"
            {...changedSchedule.recommended}
          />
        </div>
      </section>

      <RecommendationExplorer
        recommendations={recommendations}
        initialRecommendationId={INITIAL_RECOMMENDATION_ID}
      />

      <div className="mt-12 flex justify-center pb-8">
        <Button variant="default" size="lg">
          추천 더보기
        </Button>
      </div>
    </RecoveryPageLayout>
  );
}
