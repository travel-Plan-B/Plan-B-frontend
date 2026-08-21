import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  Check,
  Clock3,
  CloudRain,
  ExternalLink,
  Globe,
  Heart,
  Map,
  MapPin,
  Navigation,
  ParkingCircle,
  Phone,
  Route,
  Share2,
  Sparkles,
  Star,
  TimerReset,
  Toilet,
  Umbrella,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Tag } from "@/shared/components/ui/Tag";
import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";

const gallery = [
  {
    src: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1600&q=88",
    alt: "빛과 색으로 채워진 몰입형 미디어 아트 전시장",
  },
  {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=84",
    alt: "컬러 미디어 아트 전시",
  },
  {
    src: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=84",
    alt: "현대 미술 전시 공간",
  },
  {
    src: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=84",
    alt: "빛을 활용한 디지털 아트",
  },
  {
    src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=84",
    alt: "넓은 실내 갤러리",
  },
];

const recommendationReason = {
  category: "날씨 · 일정",
  title: "비 오는 날에도 현재 일정에 맞춰 방문하기 좋아요",
  description:
    "실내 중심의 미디어 아트 공간이라 날씨의 영향을 거의 받지 않고, 다음 일정인 경포해변까지 이동한 뒤에도 25분의 여유가 남아 일정을 자연스럽게 이어갈 수 있어요.",
};

export function PlaceDetailPage() {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <div className="flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href={ROUTES.RECOVERY_SIMPLE_RECOMMEND}
          aria-label="추천 결과로 돌아가기"
          className="inline-flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      <Gallery />
      <PlaceHeading />
      <FitAnalysis />
      <RecommendationReasons />
      <PlaceOverview />
      <VisitInformation />
      <BottomActions />
    </div>
  );
}

function Gallery() {
  return (
    <section
      aria-label="장소 사진"
      className="grid h-108 grid-cols-5 grid-rows-2 gap-2 overflow-hidden rounded-2xl max-md:h-80"
    >
      {gallery.map((image, index) => (
        <div
          key={image.src}
          className={cn(
            "group relative overflow-hidden bg-neutral-100",
            index === 0 ? "col-span-3 row-span-2" : "col-span-1",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes={index === 0 ? "(max-width: 768px) 60vw, 720px" : "240px"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {index === gallery.length - 1 && (
            <button className="absolute inset-0 flex cursor-pointer items-end justify-end bg-neutral-900/25 p-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-900/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white">
              <span className="rounded-xl bg-white/95 px-3 py-2 text-neutral-900 shadow-sm">
                사진 24장 모두 보기
              </span>
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

function PlaceHeading() {
  const actions = [
    { icon: Phone, label: "전화" },
    { icon: Globe, label: "웹사이트" },
    { icon: Heart, label: "저장" },
    { icon: Share2, label: "공유" },
  ];

  return (
    <section className="flex flex-col gap-6 border-b border-neutral-200 py-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
          <Sparkles className="size-3.5" /> AI 추천 장소
        </div>
        <h1 className="text-h1 font-bold text-neutral-900">
          아르떼뮤지엄 강릉
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
          <span>미디어 아트 · 실내 관광지 · 강릉</span>
          <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
            <Star className="size-4 fill-yellow-500 text-yellow-500" /> 4.8
          </span>
          <span>리뷰 1,234개</span>
          <span className="inline-flex items-center gap-1.5">
            <Car className="size-4" /> 차량 약 25분
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function FitAnalysis() {
  const summaries = [
    { icon: Navigation, label: "현재 위치에서", value: "12분" },
    { icon: Clock3, label: "추천 체류 시간", value: "1시간 20분" },
    { icon: Route, label: "다음 장소까지", value: "18분" },
    {
      icon: TimerReset,
      label: "일정 여유 시간",
      value: "25분",
      highlight: true,
    },
  ];

  return (
    <section
      className="mt-10 overflow-hidden rounded-2xl border border-primary-300 bg-white shadow-sm"
      aria-labelledby="fit-title"
    >
      <div className="bg-primary-50 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-wide text-primary-700">
              PLANB AI 일정 분석
            </p>
            <h2
              id="fit-title"
              className="mt-1 text-2xl font-bold text-neutral-900"
            >
              현재 일정에 자연스럽게 들어갈 수 있어요
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              현재 시간과 다음 일정까지의 이동 시간을 기준으로 분석한
              결과입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <p className="text-sm font-semibold text-neutral-800">
          현재 일정에서의 위치
        </p>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1.15fr_auto_1fr]">
          <FlowCard
            eyebrow="현재 위치"
            title="인사동"
            detail="13:20 출발"
            icon={MapPin}
          />
          <FlowArrow />
          <FlowCard
            eyebrow="추천 장소"
            title="아르떼뮤지엄 강릉"
            detail="13:32 도착 · 14:52 출발"
            icon={Sparkles}
            active
          />
          <FlowArrow />
          <FlowCard
            eyebrow="다음 일정"
            title="경포해변"
            detail="15:10 도착 예정"
            icon={CalendarClock}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map(({ icon: Icon, label, value, highlight }) => (
            <div
              key={label}
              className={cn(
                "rounded-2xl border p-4",
                highlight
                  ? "border-primary-300 bg-primary-50"
                  : "border-neutral-200 bg-neutral-50",
              )}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <Icon
                  className={cn("size-4", highlight && "text-primary-700")}
                />{" "}
                {label}
              </div>
              <p className="mt-3 text-xl font-bold text-neutral-900">{value}</p>
              {highlight && (
                <p className="mt-1 text-xs font-medium text-primary-700">
                  충분히 여유로워요
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowCard({
  eyebrow,
  title,
  detail,
  icon: Icon,
  active = false,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4",
        active
          ? "border-primary-500 bg-primary-500 text-white shadow-sm"
          : "border-neutral-200 bg-white text-neutral-900",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          active ? "bg-white/20" : "bg-neutral-100 text-neutral-700",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium",
            active ? "text-white/80" : "text-neutral-600",
          )}
        >
          {eyebrow}
        </p>
        <p className="mt-0.5 truncate font-bold">{title}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            active ? "text-white/85" : "text-neutral-600",
          )}
        >
          {detail}
        </p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-neutral-400 max-md:rotate-90">
      <ArrowRight className="size-5" />
    </div>
  );
}

function RecommendationReasons() {
  return (
    <section className="mt-14" aria-labelledby="reason-title">
      <h2 id="reason-title" className="text-2xl font-bold text-neutral-900">
        이 장소를 추천한 이유
      </h2>
      <p className="mt-2 text-sm text-neutral-700">
        현재 상황과 일정 조건을 함께 고려했어요.
      </p>
      <article className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-3xl">
          <Tag
            variant="mint"
            size="sm"
            className="gap-2 border-transparent bg-primary-50 text-primary-700"
          >
            <CloudRain className="size-4" aria-hidden="true" />
            {recommendationReason.category}
          </Tag>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            {recommendationReason.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {recommendationReason.description}
          </p>
        </div>
      </article>
    </section>
  );
}

function PlaceOverview() {
  return (
    <section
      className="mt-12 grid items-start gap-8 border-t border-neutral-200 pt-12 lg:grid-cols-[1fr_0.85fr]"
      aria-labelledby="overview-title"
    >
      <div>
        <h2 id="overview-title" className="text-2xl font-bold text-neutral-900">
          장소 소개
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-700">
          아르떼뮤지엄 강릉은 디지털 기술과 자연을 결합한 몰입형 미디어 아트
          전시 공간입니다. 파도와 숲, 별빛을 모티프로 한 작품을 오감으로 경험할
          수 있어요. 실내 관광지이기 때문에 날씨에 영향을 받지 않고 방문할 수
          있으며 약 1~2시간 정도 관람하기 좋습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["몰입형 전시", "실내 데이트", "가족 여행", "포토 스팟"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">위치</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative h-52 overflow-hidden bg-[#edf2ed]">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(32deg,transparent_48%,#d7dfd8_49%,#d7dfd8_51%,transparent_52%),linear-gradient(122deg,transparent_48%,#d7dfd8_49%,#d7dfd8_51%,transparent_52%)] [background-size:72px_72px]" />
            <div className="absolute right-0 bottom-0 h-24 w-2/5 rounded-tl-[80%] bg-[#d8eaf1]" />
            <div className="absolute top-1/2 left-1/2 flex size-12 -translate-1/2 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg ring-8 ring-white/70">
              <MapPin className="size-6 fill-current" />
            </div>
            <span className="absolute top-[62%] left-1/2 -translate-x-1/2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold shadow">
              아르떼뮤지엄 강릉
            </span>
          </div>
          <button className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-neutral-200 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50">
            <Map className="size-4" /> 지도에서 크게 보기{" "}
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function VisitInformation() {
  const rows: Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
  }> = [
    {
      icon: MapPin,
      label: "주소",
      value: "강원특별자치도 강릉시 난설헌로 131",
    },
    {
      icon: Clock3,
      label: "운영시간",
      value: (
        <>
          10:00 - 20:00{" "}
          <span className="ml-2 text-xs font-medium text-primary-700">
            운영 중
          </span>
        </>
      ),
    },
    { icon: CalendarClock, label: "휴무", value: "연중무휴" },
    { icon: Umbrella, label: "입장료", value: "성인 17,000원" },
    { icon: TimerReset, label: "추천 체류 시간", value: "약 1시간 20분" },
  ];
  const facilities = [
    { icon: ParkingCircle, label: "주차 가능" },
    { icon: Toilet, label: "화장실" },
    { icon: Umbrella, label: "실내 관광지" },
    { icon: Accessibility, label: "휠체어 접근 가능" },
  ];
  return (
    <section className="mt-10" aria-labelledby="visit-title">
      <h2 id="visit-title" className="text-2xl font-bold text-neutral-900">
        방문 정보
      </h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <dl className="divide-y divide-neutral-100">
          {rows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
            >
              <dt className="flex shrink-0 items-center gap-2 text-sm text-neutral-700 sm:w-36">
                <Icon className="size-4 text-neutral-600" />
                {label}
              </dt>
              <dd className="text-sm font-semibold text-neutral-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          <p className="text-xs font-semibold text-neutral-700">편의시설</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {facilities.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                <Icon className="size-3.5 text-neutral-600" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BottomActions() {
  return (
    <section
      className="sticky bottom-4 z-20 mt-12 flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6"
      aria-label="장소 선택"
    >
      <div>
        <p className="font-semibold text-neutral-900">
          이 장소를 선택하시겠어요?
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          이 장소를 선택하면 기존 추천 장소를 교체합니다.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href={ROUTES.RECOVERY_SIMPLE_RECOMMEND}
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:flex-none"
        >
          다른 장소 보기
        </Link>
        <Link
          href={ROUTES.RECOVERY_SIMPLE_RECOMMEND}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex-none"
        >
          <Check className="size-4" /> 이 장소로 선택
        </Link>
      </div>
    </section>
  );
}
