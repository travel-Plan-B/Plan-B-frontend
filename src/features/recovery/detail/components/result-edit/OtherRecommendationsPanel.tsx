"use client";

import { RefreshCw, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import type { ResultRecommendation } from "../../mocks/resultEditMock";
import { RecommendationGridCard } from "./RecommendationGridCard";

type SortOption = "recommended" | "rating" | "distance" | "reviews";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "별점순" },
  { value: "distance", label: "거리순" },
  { value: "reviews", label: "리뷰순" },
];

/** 한 줄(3열)만큼만 먼저 보여주고, "추천 더보기"를 누르면 나머지를 한 번에 펼친다. */
const INITIAL_VISIBLE_COUNT = 3;

/**
 * 상세보기·새로운 추천 받기는 이 이슈 범위 밖(#83)이라 UI만 두고
 * 별도 동작은 없다. 실제 재추천 로직은 별도 이슈에서 진행한다.
 */
function handleDetail() {}
function handleNewRecommendations() {}

export interface OtherRecommendationsPanelProps {
  places: ResultRecommendation[];
  onSelect: (id: string) => void;
}

export function OtherRecommendationsPanel({
  places,
  onSelect,
}: OtherRecommendationsPanelProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [expanded, setExpanded] = useState(false);

  const sortedPlaces = useMemo(() => {
    if (sortBy === "recommended") return places;
    if (sortBy === "rating") {
      return [...places].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "reviews") {
      return [...places].sort(
        (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
      );
    }
    return [...places].sort(
      (a, b) =>
        parseInt(a.travelMinutesLabel, 10) - parseInt(b.travelMinutesLabel, 10),
    );
  }, [places, sortBy]);

  const visiblePlaces = expanded
    ? sortedPlaces
    : sortedPlaces.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = sortedPlaces.length > INITIAL_VISIBLE_COUNT && !expanded;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          다른 추천 장소
        </h2>
        <Tabs
          value={sortBy}
          onChange={(value) => setSortBy(value as SortOption)}
          variant="segmented"
        >
          <TabsList role="group" aria-label="다른 추천 장소 정렬 기준">
            {SORT_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePlaces.map((place) => (
          <RecommendationGridCard
            key={place.id}
            place={place}
            onDetail={handleDetail}
            onSelect={() => onSelect(place.id)}
          />
        ))}
      </div>

      {hasMore && (
        <Button
          variant="default"
          className="gap-2 self-center rounded-full"
          onClick={() => setExpanded(true)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          추천 더보기
        </Button>
      )}

      <Button
        variant="default"
        className="w-full gap-2 rounded-full"
        onClick={handleNewRecommendations}
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        새로운 추천 받기
      </Button>
    </div>
  );
}
