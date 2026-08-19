"use client";

import {
  ArrowRight,
  Clock,
  Coins,
  Sparkles,
  Star,
  TimerReset,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { PlaceRating } from "@/features/recommendation/components/PlaceCard";
import { PlaceCardImage } from "@/features/recommendation/components/PlaceCardImage";
import { IconBadge } from "@/shared/components/ui/IconBadge";
import { Tag } from "@/shared/components/ui/Tag";

import { RecommendationList } from "./RecommendationList";
import type { Recommendation } from "./recommendation-data";

interface RecommendationExplorerProps {
  recommendations: Recommendation[];
  initialRecommendationId: string;
}

export function RecommendationExplorer({
  recommendations,
  initialRecommendationId,
}: RecommendationExplorerProps) {
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(
    initialRecommendationId,
  );
  const selectedRecommendation =
    recommendations.find(({ id }) => id === selectedRecommendationId) ??
    recommendations[0];

  if (!selectedRecommendation) return null;

  const otherRecommendations = recommendations.filter(
    ({ id }) => id !== selectedRecommendation.id,
  );

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
            <PlaceCardImage
              imageUrl={selectedRecommendation.imageUrl}
              imageAlt={selectedRecommendation.imageAlt}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="flex min-w-0 flex-col p-6 sm:p-8">
            <Tag variant="mint" size="sm" className="self-start">
              추천 1
            </Tag>
            <h3 className="mt-4 text-h1 font-semibold text-neutral-900">
              {selectedRecommendation.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-700">
              {selectedRecommendation.category} ·{" "}
              {selectedRecommendation.location}
            </p>

            <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-primary-700">
                <Sparkles className="size-5" aria-hidden="true" /> AI 추천 이유
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {selectedRecommendation.reason}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <InfoItem
                icon={<ArrowRight />}
                label="이동 · 도착"
                value={`${selectedRecommendation.travelTime} · ${selectedRecommendation.arrivalTime}`}
              />
              <InfoItem
                icon={<Clock />}
                label="예상 체류"
                value={selectedRecommendation.stayTime}
              />
              <InfoItem
                icon={<TimerReset />}
                label="일정 여유"
                value={selectedRecommendation.bufferTime}
              />
              <InfoItem
                icon={<Coins />}
                label="예상 비용"
                value={selectedRecommendation.cost}
              />
              <InfoItem
                icon={<Star />}
                label="평점"
                value={
                  <span className="inline-flex items-center gap-2">
                    <PlaceRating value={selectedRecommendation.rating} />
                    <span className="text-xs font-normal text-neutral-700">
                      ({selectedRecommendation.reviewCount.toLocaleString()})
                    </span>
                  </span>
                }
              />
            </dl>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-label="다른 추천 장소">
        <RecommendationList
          places={otherRecommendations}
          onSelect={setSelectedRecommendationId}
        />
      </section>
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
