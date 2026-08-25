"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ScheduleCard } from "@/features/recommendation/components/ScheduleCard";
import { RecoveryPageLayout } from "@/features/recovery/components/RecoveryPageLayout";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { toast } from "@/shared/components/ui/Toast/toast";
import { ROUTES } from "@/shared/config/routes";

import { RecommendationExplorer } from "./RecommendationExplorer";
import { toSimpleRecommendationResultViewModel } from "./recommendationMapper";
import { SIMPLE_RECOVERY_STEPS } from "./steps";
import { useSimpleRecoveryStore } from "./store/useSimpleRecoveryStore";

export function SimpleRecoveryRecommendPage({
  selectedPlaceId,
}: {
  selectedPlaceId?: string;
}) {
  const router = useRouter();
  const response = useSimpleRecoveryStore(
    (state) => state.recommendationResponse,
  );
  const info = useSimpleRecoveryStore((state) => state.info);
  const result = useMemo(
    () =>
      response?.success
        ? toSimpleRecommendationResultViewModel(response.data)
        : null,
    [response],
  );
  const firstRecommendationId = result?.recommendations[0]?.id ?? "";
  const initialId =
    selectedPlaceId &&
    result?.recommendations.some(({ id }) => id === selectedPlaceId)
      ? selectedPlaceId
      : firstRecommendationId;
  const [selectedRecommendationId, setSelectedRecommendationId] =
    useState(initialId);

  useEffect(() => {
    if (!response || !response.success || !firstRecommendationId) {
      toast.error("추천 결과가 없습니다. 정보를 다시 입력해 주세요.");
      router.replace(ROUTES.RECOVERY_SIMPLE_INFO);
    }
  }, [firstRecommendationId, response, router]);

  if (!result || !selectedRecommendationId) return null;

  const selectedRecommendation =
    result.recommendations.find(({ id }) => id === selectedRecommendationId) ??
    result.recommendations[0];

  if (!selectedRecommendation) return null;

  return (
    <RecoveryPageLayout
      title="추천 결과"
      description="현재 상황과 여행 취향을 반영해 가장 적합한 대체 일정을 찾았어요."
      currentStep={3}
      steps={SIMPLE_RECOVERY_STEPS}
    >
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
            title={info.selectedDestination?.name}
            location={info.selectedDestination?.address}
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
            title={selectedRecommendation.title}
            description={selectedRecommendation.description}
            location={selectedRecommendation.location}
            duration={selectedRecommendation.stayTime}
          />
        </div>
      </section>

      <RecommendationExplorer
        recommendations={result.recommendations}
        selectedRecommendationId={selectedRecommendationId}
        onSelect={setSelectedRecommendationId}
      />
    </RecoveryPageLayout>
  );
}
