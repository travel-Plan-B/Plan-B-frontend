"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  ParkingCircle,
  Phone,
  Route,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Map } from "@/shared/components/ui/Map/Map";
import { PlaceImage } from "@/shared/components/ui/PlaceImage";
import { Spinner } from "@/shared/components/ui/Spinner";
import { cn } from "@/shared/lib/cn";
import {
  isPlaceSource,
  type PlaceDetail,
  type PlaceSource,
} from "./placeDetail";
import { usePlaceDetailQuery } from "./placeDetailQuery";
import {
  getRecommendationContext,
  type RecommendationContext,
} from "./recommendationContext";

interface PlaceDetailPageProps {
  placeId: string;
  source?: string | string[];
  itemId?: string | string[];
  backHref: string;
}

export function PlaceDetailPage({
  placeId,
  source,
  itemId,
  backHref,
}: PlaceDetailPageProps) {
  const parsedSource: PlaceSource | undefined = isPlaceSource(source)
    ? source
    : undefined;
  const validIdentifiers =
    placeId.trim().length > 0 && parsedSource !== undefined;
  const query = usePlaceDetailQuery(placeId, parsedSource);
  const parsedItemId = typeof itemId === "string" ? itemId : undefined;
  const recommendationContext = parsedSource
    ? getRecommendationContext(placeId, parsedSource, parsedItemId)
    : undefined;

  if (!validIdentifiers) {
    return (
      <StatePanel
        title="장소 정보를 확인할 수 없어요"
        description="잘못된 상세 주소입니다. 추천 결과에서 장소를 다시 선택해 주세요."
        backHref={backHref}
      />
    );
  }
  if (query.isPending) return <LoadingPanel />;
  if (query.isError || !query.data) {
    return (
      <StatePanel
        title="장소 정보를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        backHref={backHref}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const place = query.data;
  return (
    <div className="flex flex-1 flex-col pb-10">
      <div className="py-6">
        <Link
          href={backHref}
          aria-label="추천 결과로 돌아가기"
          className="inline-flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      </div>
      <Gallery place={place} />
      <Heading place={place} />
      {recommendationContext && (
        <RecommendationSections
          context={recommendationContext}
          placeName={place.name}
        />
      )}
      <DetailContent place={place} />
    </div>
  );
}

function RecommendationSections({
  context,
  placeName,
}: {
  context: RecommendationContext;
  placeName: string;
}) {
  const metrics = [
    context.travelTimeFromPrevMinutes !== undefined && {
      label: "추천 장소까지 이동 시간",
      value: `${context.travelTimeFromPrevMinutes}분`,
      icon: Route,
    },
    context.estimatedDurationMinutes !== undefined && {
      label: "예상 체류 시간",
      value: `${context.estimatedDurationMinutes}분`,
      icon: Timer,
    },
    context.travelTimeToNextMinutes !== undefined && {
      label: "다음 일정까지 이동 시간",
      value: `${context.travelTimeToNextMinutes}분`,
      icon: Route,
    },
    context.scheduleBufferMinutes !== undefined && {
      label: "일정 여유 시간",
      value: `${context.scheduleBufferMinutes}분`,
      icon: Clock3,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof Clock3;
  }>;
  const hasRoute = context.previousPlaceName || context.nextPlaceName;
  const hasAnalysis = hasRoute || metrics.length > 0;
  const hasReasons = Boolean(context.recommendReasons?.length);

  if (!hasAnalysis && !hasReasons) return null;

  return (
    <div className="mt-8 space-y-12">
      {hasAnalysis && (
        <section
          aria-labelledby="schedule-analysis-title"
          className="overflow-hidden rounded-2xl border border-primary-400 bg-white"
        >
          <div className="border-b border-primary-100 bg-primary-50 p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
                <Check className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-primary-700">
                  PLAN B 일정 분석
                </p>
                <h2
                  id="schedule-analysis-title"
                  className="mt-1 text-xl font-bold text-neutral-900"
                >
                  현재 일정에 자연스럽게 들어갈 수 있어요
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6">
            {hasRoute && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  현재 일정 동선
                </h3>
                <div
                  className={cn(
                    "mt-4 grid items-center gap-3",
                    context.nextPlaceName
                      ? "md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
                      : "md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
                  )}
                >
                  {context.previousPlaceName && (
                    <RoutePlace
                      label={context.itemId ? "이전 일정" : "현재 위치"}
                      name={context.previousPlaceName}
                    />
                  )}
                  {context.previousPlaceName && (
                    <ArrowRight
                      className="mx-auto size-5 text-neutral-600 max-md:rotate-90"
                      aria-hidden="true"
                    />
                  )}
                  <RoutePlace label="추천 장소" name={placeName} highlighted />
                  {context.nextPlaceName && (
                    <ArrowRight
                      className="mx-auto size-5 text-neutral-600 max-md:rotate-90"
                      aria-hidden="true"
                    />
                  )}
                  {context.nextPlaceName && (
                    <RoutePlace
                      label="다음 일정"
                      name={context.nextPlaceName}
                    />
                  )}
                </div>
              </div>
            )}

            {metrics.length > 0 && (
              <div
                className={
                  hasRoute ? "border-t border-neutral-200 pt-8" : undefined
                }
              >
                <h3 className="text-sm font-semibold text-neutral-900">
                  이동 · 체류 시간 분석
                </h3>
                <dl
                  className={cn(
                    "mt-4 grid gap-3 sm:grid-cols-2",
                    metrics.length >= 3 && "lg:grid-cols-4",
                  )}
                >
                  {metrics.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <Icon
                        className="size-5 text-neutral-600"
                        aria-hidden="true"
                      />
                      <dt className="mt-3 text-xs text-neutral-700">{label}</dt>
                      <dd className="mt-1 text-xl font-bold text-neutral-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {hasReasons && (
        <section aria-labelledby="recommend-reason-title">
          <h2
            id="recommend-reason-title"
            className="text-2xl font-bold text-neutral-900"
          >
            이 장소를 추천한 이유
          </h2>
          <ul className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-6">
            {context.recommendReasons?.map((reason, index) => (
              <li
                key={`${index}-${reason}`}
                className="flex items-start gap-3 text-sm leading-6 text-neutral-700"
              >
                <Sparkles
                  className="mt-0.5 size-5 shrink-0 text-primary-500"
                  aria-hidden="true"
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RoutePlace({
  label,
  name,
  highlighted = false,
}: {
  label: string;
  name: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-4",
        highlighted
          ? "border-primary-500 bg-primary-500 text-white"
          : "border-neutral-200 bg-white",
      )}
    >
      <p
        className={cn(
          "text-xs",
          highlighted ? "text-white/80" : "text-neutral-600",
        )}
      >
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{name}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <section className="flex min-h-96 flex-1 items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3 text-sm text-neutral-700">
        <Spinner size="lg" />
        장소 상세 정보를 불러오는 중이에요.
      </div>
    </section>
  );
}

function StatePanel({
  title,
  description,
  backHref,
  onRetry,
}: {
  title: string;
  description: string;
  backHref: string;
  onRetry?: () => void;
}) {
  return (
    <section className="flex min-h-96 flex-1 items-center justify-center py-16 text-center">
      <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700">{description}</p>
        <div className="mt-6 flex justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              다시 시도
            </button>
          )}
          <Link
            href={backHref}
            className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white"
          >
            추천 결과로 돌아가기
          </Link>
        </div>
      </div>
    </section>
  );
}

function Gallery({ place }: { place: PlaceDetail }) {
  const visibleImages = place.imageUrls.slice(0, 5);
  if (visibleImages.length === 0) {
    return (
      <section
        aria-label="장소 사진"
        className="relative h-108 overflow-hidden rounded-2xl bg-neutral-100 max-md:h-80"
      >
        <PlaceImage imageAlt={place.name} sizes="100vw" />
      </section>
    );
  }
  if (visibleImages.length === 1) {
    return (
      <section
        aria-label="장소 사진"
        className="relative h-108 overflow-hidden rounded-2xl bg-neutral-100 max-md:h-80"
      >
        <PlaceImage
          imageUrl={visibleImages[0]}
          imageAlt={place.name}
          sizes="100vw"
        />
      </section>
    );
  }

  const galleryLayout = {
    2: "md:grid-cols-2 md:grid-rows-1",
    3: "md:grid-cols-2 md:grid-rows-2",
    4: "md:grid-cols-3 md:grid-rows-3",
    5: "md:grid-cols-5 md:grid-rows-2",
  }[visibleImages.length];

  const primaryImageLayout = {
    2: "md:col-span-1 md:row-span-1",
    3: "md:col-span-1 md:row-span-2",
    4: "md:col-span-2 md:row-span-3",
    5: "md:col-span-3 md:row-span-2",
  }[visibleImages.length];

  return (
    <section
      aria-label="장소 사진"
      className={cn(
        "grid h-80 grid-cols-1 grid-rows-1 gap-2 overflow-hidden rounded-2xl md:h-108",
        galleryLayout,
      )}
    >
      {visibleImages.map((imageUrl, index) => (
        <div
          key={imageUrl}
          className={cn(
            "relative overflow-hidden bg-neutral-100",
            index === 0
              ? ["col-span-1 row-span-1", primaryImageLayout]
              : "hidden md:block",
          )}
        >
          <PlaceImage
            imageUrl={imageUrl}
            imageAlt={`${place.name} 사진 ${index + 1}`}
            sizes={
              index === 0
                ? "(max-width: 767px) calc(100vw - 48px), 720px"
                : "240px"
            }
            showFallbackLabel={false}
          />
          {index === 0 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-neutral-900/75 px-3 py-1 text-xs font-semibold text-white">
              1 / {place.imageUrls.length}
            </span>
          )}
          {index === visibleImages.length - 1 &&
            place.imageUrls.length > visibleImages.length && (
              <span className="absolute right-4 bottom-4 rounded-xl bg-white/95 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm">
                사진 {place.imageUrls.length}장
              </span>
            )}
        </div>
      ))}
    </section>
  );
}

function Heading({ place }: { place: PlaceDetail }) {
  const hasActions = place.phone || place.homepageUrl || place.placeUrl;

  return (
    <section className="flex flex-col gap-6 border-b border-neutral-200 py-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-h1 font-bold text-neutral-900">{place.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
          <span>{place.category}</span>
          {place.rating !== undefined && (
            <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
              <Star
                className="size-4 fill-yellow-500 text-yellow-500"
                aria-hidden="true"
              />
              {place.rating.toFixed(1)}
            </span>
          )}
          {place.userRatingCount !== undefined && (
            <span>리뷰 {place.userRatingCount.toLocaleString()}개</span>
          )}
        </div>
        {place.address && (
          <p className="mt-2 text-sm text-neutral-700">{place.address}</p>
        )}
      </div>
      {hasActions && (
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {place.phone && (
            <ActionLink href={`tel:${place.phone}`} icon={Phone}>
              전화
            </ActionLink>
          )}
          {place.homepageUrl && (
            <ActionLink href={place.homepageUrl} icon={Globe} external>
              웹사이트
            </ActionLink>
          )}
          {place.placeUrl && (
            <ActionLink href={place.placeUrl} icon={ExternalLink} external>
              외부 장소 페이지
            </ActionLink>
          )}
        </div>
      )}
    </section>
  );
}

function ActionLink({
  href,
  icon: Icon,
  external,
  children,
}: {
  href: string;
  icon: typeof Phone;
  external?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </a>
  );
}

function DetailContent({ place }: { place: PlaceDetail }) {
  const hasCoordinates =
    place.lat !== undefined &&
    place.lng !== undefined &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng);

  return (
    <div
      className={cn(
        "mt-12 grid items-start gap-8",
        hasCoordinates && "lg:grid-cols-[1.15fr_0.85fr]",
      )}
    >
      <div className="min-w-0">
        <Description place={place} />
        <VisitInformation place={place} />
      </div>
      {hasCoordinates && <Location place={place} />}
    </div>
  );
}

function Description({ place }: { place: PlaceDetail }) {
  if (!place.description) return null;

  return (
    <section aria-labelledby="description-title">
      <h2
        id="description-title"
        className="text-2xl font-bold text-neutral-900"
      >
        장소 소개
      </h2>
      <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-700">
        {place.description}
      </p>
    </section>
  );
}

function Location({ place }: { place: PlaceDetail }) {
  return (
    <section aria-labelledby="location-title">
      <h2 id="location-title" className="text-2xl font-bold text-neutral-900">
        위치
      </h2>
      <Map
        className="mt-6 h-72 border border-neutral-200"
        markers={[
          {
            id: place.placeId,
            lat: place.lat as number,
            lng: place.lng as number,
            title: place.name,
            description: place.address,
            color: "#00C0AB",
          },
        ]}
      />
    </section>
  );
}

function VisitInformation({ place }: { place: PlaceDetail }) {
  const rows = [
    place.address && { icon: MapPin, label: "주소", value: place.address },
    place.businessStatus && {
      icon: Clock3,
      label: "영업 상태",
      value: place.businessStatus,
    },
    place.businessHours && {
      icon: Clock3,
      label: "운영 시간",
      value: place.businessHours,
    },
    place.phone && {
      icon: Phone,
      label: "전화",
      value: <a href={`tel:${place.phone}`}>{place.phone}</a>,
    },
    place.parking && {
      icon: ParkingCircle,
      label: "주차",
      value: place.parking,
    },
  ].filter(Boolean) as Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
  }>;
  if (rows.length === 0) return null;
  return (
    <section
      className={place.description ? "mt-12" : undefined}
      aria-labelledby="visit-title"
    >
      <h2 id="visit-title" className="text-2xl font-bold text-neutral-900">
        방문 정보
      </h2>
      <dl className="mt-6 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
          >
            <dt className="flex shrink-0 items-center gap-2 text-sm text-neutral-700 sm:w-36">
              <Icon className="size-4 text-neutral-600" aria-hidden="true" />
              {label}
            </dt>
            <dd className="text-sm font-semibold text-neutral-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
