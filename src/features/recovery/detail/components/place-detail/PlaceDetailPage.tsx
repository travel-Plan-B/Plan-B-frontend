"use client";

import {
  ArrowLeft,
  Car,
  Clock,
  MapPin,
  ParkingCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { PlaceRating } from "@/features/recommendation/components/PlaceCard";
import { ROUTES } from "@/shared/config/routes";
import { formatDistanceKm } from "../../lib/travelInfo";
import type { ResultRecommendation } from "../../mocks/resultEditMock";
import { useRecoveryDraftStore } from "../../store/useRecoveryDraftStore";

/**
 * 3단계 "상세보기" 클릭 시 이동하는 추천 장소 상세 페이지. 별도 API 호출 없이
 * 2~3단계에서 이미 REQ-DETAIL-002로 받아둔 recommendationsByItemId(스토어,
 * localStorage persist)에서 placeId로 후보를 찾아 보여준다 — 그 결과 밖의
 * 장소(주소/휴무일/편의시설 등 REQ-DETAIL-002에 없는 정보)는 다루지 않는다.
 */
function findRecommendation(
  recommendationsByItemId: Record<
    string,
    { best: ResultRecommendation | null; others: ResultRecommendation[] }
  >,
  placeId: string,
): ResultRecommendation | undefined {
  for (const result of Object.values(recommendationsByItemId)) {
    if (result.best?.id === placeId) return result.best;
    const fromOthers = result.others.find((place) => place.id === placeId);
    if (fromOthers) return fromOthers;
  }
  return undefined;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-700">
      <Icon className="size-4 text-neutral-600" aria-hidden="true" />
      <span>{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export function PlaceDetailPage({ placeId }: { placeId: string }) {
  const { recommendationsByItemId, hasHydrated } = useRecoveryDraftStore();

  useEffect(() => {
    void useRecoveryDraftStore.persist.rehydrate();
  }, []);

  const place = useMemo(
    () => findRecommendation(recommendationsByItemId, placeId),
    [recommendationsByItemId, placeId],
  );

  if (!hasHydrated) return null;

  if (!place) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          추천 정보를 찾을 수 없어요
        </p>
        <p className="text-sm text-neutral-600">
          복구 진행 중에만 볼 수 있는 상세 정보예요. 처음부터 다시 진행해주세요.
        </p>
        <Link
          href={ROUTES.RECOVERY_DETAIL}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          복구 플로우로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pb-10">
      <Link
        href={ROUTES.RECOVERY_DETAIL}
        aria-label="이전 화면으로 돌아가기"
        className="inline-flex size-10 items-center justify-center self-start rounded-full border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-100"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-neutral-100">
          <PlaceImage
            imageUrl={place.imageUrl}
            imageAlt={place.imageAlt}
            sizes="(max-width: 1024px) 100vw, 700px"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            {place.isAiRecommended && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
                <Sparkles className="size-3.5" aria-hidden="true" />
                AI 추천 장소
              </div>
            )}
            <h1 className="text-h1 font-bold text-neutral-900">
              {place.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-700">
              <span>{place.category}</span>
              <PlaceRating value={place.rating} />
              {place.reviewCount !== undefined && (
                <span className="text-neutral-600">
                  리뷰 {place.reviewCount.toLocaleString()}개
                </span>
              )}
            </div>
          </div>

          {place.isAiRecommended &&
            place.reasons &&
            place.reasons.length > 0 && (
              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                  <Sparkles className="size-4" aria-hidden="true" />
                  AI 추천 이유
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {place.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-2 text-sm text-neutral-700"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-primary-500"
                      />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
            <InfoRow
              icon={Car}
              label="이동 시간"
              value={place.travelMinutesLabel}
            />
            <InfoRow
              icon={MapPin}
              label="거리"
              value={formatDistanceKm(place.distanceKm)}
            />
            <InfoRow
              icon={ParkingCircle}
              label="주차"
              value={place.parkingLabel ?? "제공없음"}
            />
            <InfoRow icon={Clock} label="운영 시간" value={place.hoursLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}
