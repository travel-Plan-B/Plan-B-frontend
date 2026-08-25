"use client";

import { ArrowRight, Check, Clock, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconBadge } from "@/shared/components/ui/IconBadge";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Tag } from "@/shared/components/ui/Tag";
import { ROUTES } from "@/shared/config/routes";

import { RecommendationList } from "./RecommendationList";
import { FIXTURE_PLACE_DETAIL_ID } from "./recommendation-data";
import type { SimpleRecommendationViewModel } from "./recommendationMapper";

interface RecommendationExplorerProps {
  recommendations: SimpleRecommendationViewModel[];
  selectedRecommendationId: string;
  onSelect: (id: string) => void;
}

export function RecommendationExplorer({
  recommendations,
  selectedRecommendationId,
  onSelect,
}: RecommendationExplorerProps) {
  const selectedRecommendation =
    recommendations.find(({ id }) => id === selectedRecommendationId) ??
    recommendations[0];

  if (!selectedRecommendation) return null;

  const otherRecommendations = recommendations.filter(
    ({ id }) => id !== selectedRecommendation.id,
  );
  const hasRecommendationReasons = selectedRecommendation.reasons.length > 0;
  const recommendationPanelTitle = selectedRecommendation.isAiRecommended
    ? hasRecommendationReasons
      ? "AI 추천 이유"
      : "AI 추천"
    : "추가 추천 장소";
  const travelSummary = [
    selectedRecommendation.travelTime,
    selectedRecommendation.distance,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <section className="mt-12" aria-labelledby="best-recommendation-title">
        <h2
          id="best-recommendation-title"
          className="text-2xl font-semibold text-neutral-900"
        >
          가장 적합한 추천
        </h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white lg:grid lg:grid-cols-2">
          <div className="relative aspect-4/3 bg-neutral-100 lg:aspect-auto lg:min-h-full">
            <PlaceImage
              imageUrl={selectedRecommendation.imageUrl}
              imageAlt={selectedRecommendation.imageAlt}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:min-h-112">
            {selectedRecommendation.isAiRecommended && (
              <Tag variant="mint" size="sm" className="self-start">
                AI 추천
              </Tag>
            )}
            <h3 className="mt-4 text-h1 font-semibold text-neutral-900">
              {selectedRecommendation.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-700">
              {[
                selectedRecommendation.category,
                selectedRecommendation.location,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              {travelSummary && (
                <InfoItem
                  icon={<ArrowRight />}
                  label="이동 시간"
                  value={travelSummary}
                />
              )}
              <InfoItem
                icon={<Clock />}
                label="예상 체류"
                value={selectedRecommendation.stayTime}
              />
              {selectedRecommendation.rating !== undefined && (
                <InfoItem
                  icon={<Star />}
                  label="평점"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">
                        {selectedRecommendation.rating.toFixed(1)}
                      </span>
                      {selectedRecommendation.reviewCount !== undefined && (
                        <span className="text-xs font-normal text-neutral-700">
                          ({selectedRecommendation.reviewCount.toLocaleString()}
                          )
                        </span>
                      )}
                    </span>
                  }
                />
              )}
            </dl>

            <div className="mt-6 flex flex-1 flex-col rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-primary-700">
                <Sparkles className="size-5" aria-hidden="true" />
                {recommendationPanelTitle}
              </div>
              {hasRecommendationReasons ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
                  {selectedRecommendation.reasons.map((reason, index) => (
                    <li
                      key={`${index}-${reason}`}
                      className="flex items-start gap-2"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-primary-700"
                      />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : selectedRecommendation.isAiRecommended ? (
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  추천 이유를 준비 중이에요. 장소 정보와 이동 시간을 함께 확인해
                  보세요.
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  장소 정보와 이동 조건을 비교해 보고 선택해 보세요.
                </p>
              )}
            </div>

            <Link
              href={ROUTES.RECOVERY_SIMPLE_PLACE_DETAIL(
                FIXTURE_PLACE_DETAIL_ID,
              )}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              상세보기 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {otherRecommendations.length > 0 && (
        <section className="mt-12" aria-label="다른 추천 장소">
          <RecommendationList
            places={otherRecommendations}
            onSelect={onSelect}
          />
        </section>
      )}
    </>
  );
}

interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <IconBadge variant="gray" size="sm" className="[&>svg]:size-4">
        {icon}
      </IconBadge>
      <div className="min-w-0">
        <dt className="text-xs text-neutral-600">{label}</dt>
        <dd className="mt-1 break-words font-medium text-neutral-900">
          {value}
        </dd>
      </div>
    </div>
  );
}
