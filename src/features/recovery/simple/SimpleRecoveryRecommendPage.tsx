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
  const referenceLocation = info.referenceLocation;
  const result = useMemo(
    () =>
      response?.success
        ? toSimpleRecommendationResultViewModel(response.data)
        : null,
    [response],
  );
  const firstRecommendationId = result?.recommendations[0]?.id ?? "";
  const noCandidatesReason = response?.success
    ? response.data.no_candidates_reason
    : null;
  const initialId =
    selectedPlaceId &&
    result?.recommendations.some(({ id }) => id === selectedPlaceId)
      ? selectedPlaceId
      : firstRecommendationId;
  const [selectedRecommendationId, setSelectedRecommendationId] =
    useState(initialId);

  useEffect(() => {
    if (!response || !response.success) {
      toast.error("추천 요청에 실패했습니다. 정보를 다시 입력해 주세요.");
      router.replace(ROUTES.RECOVERY_SIMPLE_INFO);
      return;
    }

    if (!firstRecommendationId) {
      if (noCandidatesReason === "NOT_ENOUGH_TIME") {
        toast.info(
          "추천할 수 있는 시간이 부족해요. 도착 시간을 조금 더 여유 있게 설정해 주세요.",
        );
      } else if (noCandidatesReason === "NO_SUITABLE_PLACE") {
        toast.info(
          "조건에 맞는 추천 장소를 찾지 못했어요. 복구 대상 장소나 조건을 바꿔 다시 시도해 주세요.",
        );
      } else {
        toast.info("추천 결과가 없습니다. 정보를 다시 입력해 주세요.");
      }
      router.replace(ROUTES.RECOVERY_SIMPLE_INFO);
      return;
    }

    if (!referenceLocation) {
      toast.error("복구 대상 장소 정보가 없습니다. 정보를 다시 입력해 주세요.");
      router.replace(ROUTES.RECOVERY_SIMPLE_INFO);
    }
  }, [
    firstRecommendationId,
    noCandidatesReason,
    referenceLocation,
    response,
    router,
  ]);

  if (!result || !selectedRecommendationId || !referenceLocation) return null;

  const selectedRecommendation =
    result.recommendations.find(({ id }) => id === selectedRecommendationId) ??
    result.recommendations[0];

  if (!selectedRecommendation) return null;

  const sourceSchedule = {
    label: "복구 대상 장소",
    title: referenceLocation.name,
    location: referenceLocation.address,
  };

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
          추천 일정
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          문제가 생긴 기존 장소를 대체할 새로운 일정을 추천했어요.
        </p>

        <div className="mt-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <ScheduleCard tone="rose" className="h-full" {...sourceSchedule} />
          <IconBadge
            variant="gray"
            size="md"
            className="mx-auto self-center rotate-90 md:rotate-0"
          >
            <ArrowRight className="size-5" />
          </IconBadge>
          <ScheduleCard
            tone="purple"
            className="h-full"
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
        previousPlaceName={sourceSchedule.title}
        origin={{ lat: referenceLocation.lat, lng: referenceLocation.lng }}
        initialTransport={info.transport ?? "car"}
        onSelect={setSelectedRecommendationId}
      />
    </RecoveryPageLayout>
  );
}
