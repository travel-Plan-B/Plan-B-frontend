"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PlaceCard } from "@/features/recommendation/components/PlaceCard";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { ROUTES } from "@/shared/config/routes";
import { FIXTURE_PLACE_DETAIL_ID } from "./recommendation-data";
import type { SimpleRecommendationViewModel } from "./recommendationMapper";

type RecommendationSort = "recommended" | "rating" | "reviews";

interface RecommendationListProps {
  places: SimpleRecommendationViewModel[];
  onSelect: (id: string) => void;
}

const sortOptions: Array<{ value: RecommendationSort; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "별점순" },
  { value: "reviews", label: "리뷰순" },
];

export function RecommendationList({
  places,
  onSelect,
}: RecommendationListProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<RecommendationSort>("recommended");

  const sortedPlaces = useMemo(() => {
    if (sortBy === "recommended") return places;

    return [...places].sort((a, b) => {
      if (sortBy === "reviews")
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [places, sortBy]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            다른 추천 장소
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            복구 조건에 잘 맞는 다른 장소도 살펴보세요.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-sm font-medium text-neutral-700">
            정렬 기준
          </span>
          <Tabs
            value={sortBy}
            onChange={(value) => setSortBy(value as RecommendationSort)}
            variant="segmented"
          >
            <TabsList role="group" aria-label="다른 추천 장소 정렬 기준">
              {sortOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-stretch justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            variant="compact"
            imageUrl={place.imageUrl}
            imageAlt={place.imageAlt}
            title={place.title}
            category={place.category}
            location={place.location}
            rating={place.rating}
            reviewCount={place.reviewCount}
            distance={place.distance}
            hours={place.hours}
            parking={place.parking}
            recommended={place.isAiRecommended}
            onDetail={() =>
              router.push(
                ROUTES.RECOVERY_SIMPLE_PLACE_DETAIL(FIXTURE_PLACE_DETAIL_ID),
              )
            }
            onSelect={() => onSelect(place.id)}
            className="h-full"
          />
        ))}
      </div>
    </>
  );
}
