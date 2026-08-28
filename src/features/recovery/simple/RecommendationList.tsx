"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";

import { PlaceCard } from "@/features/recommendation/components/PlaceCard";
import { useTravelMinutesLabel } from "@/features/recovery/detail/hooks/useTravelMinutesLabel";
import {
  formatDistanceKm,
  haversineDistanceKm,
} from "@/features/recovery/detail/lib/travelInfo";
import {
  TRANSPORT_LABEL,
  TRANSPORT_ORDER,
  TRAVEL_ICON_BY_MODE,
} from "@/features/recovery/detail/lib/transportOptions";
import { getPlaceDetail } from "@/features/recovery/place-detail/placeDetail";
import { placeDetailKeys } from "@/features/recovery/place-detail/placeDetailQuery";
import { Button } from "@/shared/components/ui/Button";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { ROUTES } from "@/shared/config/routes";
import {
  toSimpleRecommendationContext,
  type SimpleRecommendationViewModel,
} from "./recommendationMapper";
import { saveRecommendationContext } from "../place-detail/recommendationContext";
import type { TransportType } from "./TransportSelector";
import { compareRecommendationDistance } from "./recommendationDistance";

type RecommendationSort = "recommended" | "rating" | "distance" | "reviews";

interface RecommendationListProps {
  places: SimpleRecommendationViewModel[];
  previousPlaceName: string;
  origin: { lat: number; lng: number };
  initialTransport: TransportType;
  onSelect: (id: string) => void;
}

const sortOptions: Array<{ value: RecommendationSort; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "별점순" },
  { value: "distance", label: "거리순" },
  { value: "reviews", label: "리뷰순" },
];

const INITIAL_VISIBLE_COUNT = 3;

function SimpleRecommendationCard({
  place,
  origin,
  destination,
  distanceKm,
  transport,
  previousPlaceName,
  onSelect,
}: {
  place: SimpleRecommendationViewModel;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  distanceKm: number | null;
  transport: TransportType;
  previousPlaceName: string;
  onSelect: () => void;
}) {
  const router = useRouter();
  const travelMinutesLabel = useTravelMinutesLabel(
    origin,
    destination,
    distanceKm,
    transport,
  );
  const travelTime =
    travelMinutesLabel === "정보 없음"
      ? travelMinutesLabel
      : `${TRANSPORT_LABEL[transport]} ${travelMinutesLabel}`;

  return (
    <PlaceCard
      variant="compact"
      imageUrl={place.imageUrl}
      imageAlt={place.imageAlt}
      title={place.title}
      category={place.category}
      location={place.location}
      rating={place.rating}
      reviewCount={place.reviewCount}
      travelTime={travelTime}
      travelIcon={TRAVEL_ICON_BY_MODE[transport]}
      distance={formatDistanceKm(distanceKm)}
      hours={place.hours ?? "제공없음"}
      parking={place.parking ?? "제공없음"}
      recommended={place.isAiRecommended}
      onDetail={() => {
        saveRecommendationContext(
          toSimpleRecommendationContext(place, previousPlaceName),
        );
        router.push(
          ROUTES.RECOVERY_SIMPLE_PLACE_DETAIL(place.id, place.source),
        );
      }}
      onSelect={onSelect}
      className="h-full min-w-0 max-w-none sm:min-w-0 sm:max-w-none"
    />
  );
}

export function RecommendationList({
  places,
  previousPlaceName,
  origin,
  initialTransport,
  onSelect,
}: RecommendationListProps) {
  const [sortBy, setSortBy] = useState<RecommendationSort>("recommended");
  const [expanded, setExpanded] = useState(false);
  const [transport, setTransport] = useState<TransportType>(initialTransport);
  const detailQueries = useQueries({
    queries: places.map((place, index) => ({
      queryKey: placeDetailKeys.detail(place.id, place.source),
      queryFn: () => getPlaceDetail(place.id, place.source),
      enabled:
        expanded || sortBy === "distance" || index < INITIAL_VISIBLE_COUNT,
      retry: 1,
    })),
  });

  const placesWithDistance = places.map((place, index) => {
    const detail = detailQueries[index]?.data;
    const destination =
      detail?.lat !== undefined && detail.lng !== undefined
        ? { lat: detail.lat, lng: detail.lng }
        : null;

    return {
      place,
      destination,
      distanceKm: destination ? haversineDistanceKm(origin, destination) : null,
    };
  });

  const sortedPlaces =
    sortBy === "recommended"
      ? placesWithDistance
      : [...placesWithDistance].sort((a, b) => {
          if (sortBy === "reviews")
            return (b.place.reviewCount ?? 0) - (a.place.reviewCount ?? 0);
          if (sortBy === "distance") return compareRecommendationDistance(a, b);
          return (b.place.rating ?? 0) - (a.place.rating ?? 0);
        });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          다른 추천 장소
        </h2>
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

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">이동수단</span>
        {TRANSPORT_ORDER.map((mode) => {
          const selected = transport === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTransport(mode)}
              aria-pressed={selected}
              className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                selected
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {TRANSPORT_LABEL[mode]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(expanded
          ? sortedPlaces
          : sortedPlaces.slice(0, INITIAL_VISIBLE_COUNT)
        ).map(({ place, destination, distanceKm }) => (
          <SimpleRecommendationCard
            key={place.id}
            place={place}
            origin={origin}
            destination={destination}
            distanceKm={distanceKm}
            transport={transport}
            previousPlaceName={previousPlaceName}
            onSelect={() => onSelect(place.id)}
          />
        ))}
      </div>

      {!expanded && sortedPlaces.length > INITIAL_VISIBLE_COUNT && (
        <Button
          variant="default"
          className="gap-2 self-center rounded-full"
          onClick={() => setExpanded(true)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          추천 더보기
        </Button>
      )}
    </div>
  );
}
