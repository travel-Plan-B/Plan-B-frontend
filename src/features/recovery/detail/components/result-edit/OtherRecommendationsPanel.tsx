"use client";

import { RotateCw } from "lucide-react";
import { useMemo, useState } from "react";

import { PlaceCard } from "@/features/recommendation/components/PlaceCard";
import { Button } from "@/shared/components/ui/Button";
import { Tabs } from "@/shared/components/ui/Tabs/Tabs";
import { TabsList } from "@/shared/components/ui/Tabs/TabsList";
import { TabsTrigger } from "@/shared/components/ui/Tabs/TabsTrigger";
import { useTravelMinutesLabel } from "../../hooks/useTravelMinutesLabel";
import { formatDistanceKm } from "../../lib/travelInfo";
import {
  TRANSPORT_LABEL,
  TRANSPORT_ORDER,
  TRAVEL_ICON_BY_MODE,
} from "../../lib/transportOptions";
import type { ResultRecommendation } from "../../mocks/resultEditMock";
import type { TransportMode } from "../../mocks/scheduleMock";

type SortOption = "recommended" | "rating" | "distance" | "reviews";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "별점순" },
  { value: "distance", label: "거리순" },
  { value: "reviews", label: "리뷰순" },
];

/** 한 줄(3열)만큼만 먼저 보여주고, "추천 더보기"를 누르면 나머지를 한 번에 펼친다. */
const INITIAL_VISIBLE_COUNT = 3;

export interface OtherRecommendationsPanelProps {
  places: ResultRecommendation[];
  /** 왼쪽 목록의 실제 이동수단 — 이 섹션 자체 토글의 초기값으로만 쓴다.
   * BEST 카드 토글과도, 왼쪽 목록 토글과도 별개로 이 섹션만의 상태를 갖는다
   * ("다른 추천 장소가 BEST 카드 토글 따라 바뀌면 안 된다"는 피드백,
   * "여기도 도보/자동차/대중교통 탭 있어야 하는거 아니냐"는 피드백을 반영). */
  transport: TransportMode;
  /** 교체 대상(원래 장소) 좌표 — 대중교통이면 이 좌표로 오디세이 실시간 조회를 한다. */
  origin: { lat: number; lng: number } | null;
  /** 실제로 적용된 추천 후보 id — 그 카드만 "선택완료"로 비활성화한다. */
  appliedRecommendationId?: string;
  onSelect: (id: string) => void;
  onDetail: (id: string) => void;
}

/**
 * PlaceCard 하나를 감싸서 "이동 시간"만 훅으로 따로 계산한다 — 대중교통일 때
 * 카드마다 오디세이 실시간 조회가 필요한데, 훅은 map() 안에서 바로 못 불러서
 * 카드 개수만큼 이 컴포넌트를 렌더링하는 방식으로 우회한다.
 */
function OtherRecommendationCard({
  place,
  transport,
  origin,
  selected,
  onDetail,
  onSelect,
}: {
  place: ResultRecommendation;
  transport: TransportMode;
  origin: { lat: number; lng: number } | null;
  selected: boolean;
  onDetail: () => void;
  onSelect: () => void;
}) {
  const travelMinutesLabel = useTravelMinutesLabel(
    origin,
    { lat: place.lat, lng: place.lng },
    place.distanceKm,
    transport,
  );
  const travelTime =
    travelMinutesLabel === "정보 없음"
      ? travelMinutesLabel
      : `${TRANSPORT_LABEL[transport]} ${travelMinutesLabel}`;

  return (
    <PlaceCard
      variant="compact"
      recommended={place.isAiRecommended}
      imageUrl={place.imageUrl}
      imageAlt={place.imageAlt}
      title={place.title}
      category={place.category}
      rating={place.rating}
      selected={selected}
      travelTime={travelTime}
      travelIcon={TRAVEL_ICON_BY_MODE[transport]}
      distance={formatDistanceKm(place.distanceKm)}
      hours={place.hoursLabel}
      parking={place.parkingLabel ?? "제공없음"}
      onDetail={onDetail}
      onSelect={onSelect}
      // PlaceCard(compact) 기본 min/max-width(320~360px)를 없애서, 카드가
      // 아래 grid 트랙 폭에 맞춰 꽉 차게(justify-items-stretch) 늘어나거나
      // 줄어들 수 있게 한다.
      className="h-full min-w-0 max-w-none sm:min-w-0 sm:max-w-none"
    />
  );
}

export function OtherRecommendationsPanel({
  places,
  transport,
  origin,
  appliedRecommendationId,
  onSelect,
  onDetail,
}: OtherRecommendationsPanelProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [expanded, setExpanded] = useState(false);
  const [gridTransport, setGridTransport] = useState<TransportMode>(transport);

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
    // distanceKm이 없는(null) 카드는 정렬 기준이 없으니 맨 뒤로 보낸다.
    return [...places].sort((a, b) => {
      if (a.distanceKm == null) return b.distanceKm == null ? 0 : 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [places, sortBy]);

  const visiblePlaces = expanded
    ? sortedPlaces
    : sortedPlaces.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = sortedPlaces.length > INITIAL_VISIBLE_COUNT && !expanded;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">이동수단</span>
        {TRANSPORT_ORDER.map((mode) => {
          const isSelected = gridTransport === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setGridTransport(mode)}
              aria-pressed={isSelected}
              aria-label={TRANSPORT_LABEL[mode]}
              className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {TRANSPORT_LABEL[mode]}
            </button>
          );
        })}
      </div>

      {/* sm/lg 뷰포트 브레이크포인트 대신 컨테이너 실제 폭으로 열 개수를
          정한다 — 카드 하나가 240px보다 좁아지면 자동으로 다음 줄로
          내려가고, 넓으면(justify-items-stretch) 화면 폭에 꽉 차게 늘어난다.
          auto-fill이 아니라 auto-fit을 쓴다 — 처음엔 카드가 3개뿐이라
          (INITIAL_VISIBLE_COUNT), 폭이 4열 들어갈 만큼 넓으면 auto-fill은
          안 채워진 4번째 트랙을 빈 채로 남겨 오른쪽이 비어 보인다. auto-fit은
          빈 트랙을 접어서 있는 카드들이 그 자리까지 나눠 채운다. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] justify-items-stretch gap-4">
        {visiblePlaces.map((place) => (
          <OtherRecommendationCard
            key={place.id}
            place={place}
            transport={gridTransport}
            origin={origin}
            selected={place.id === appliedRecommendationId}
            onDetail={() => onDetail(place.id)}
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
    </div>
  );
}
