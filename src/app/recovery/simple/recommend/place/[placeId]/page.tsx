import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceDetailPage } from "@/features/recovery/simple/place-detail/PlaceDetailPage";
import {
  getPlaceDetailFixture,
  PLACE_DETAIL_IDS,
} from "@/features/recovery/simple/place-detail/placeDetailFixtures";

export const metadata: Metadata = {
  title: "추천 장소 상세 | PlanB",
  description:
    "현재 일정에 맞는 대체 장소의 상세 정보와 AI 추천 이유를 확인하세요.",
};

export function generateStaticParams() {
  return PLACE_DETAIL_IDS.map((placeId) => ({ placeId }));
}

export default async function SimpleRecoveryPlaceDetailRoute({
  params,
}: PageProps<"/recovery/simple/recommend/place/[placeId]">) {
  const { placeId } = await params;
  const place = getPlaceDetailFixture(placeId);

  if (!place) notFound();

  return <PlaceDetailPage place={place} />;
}
