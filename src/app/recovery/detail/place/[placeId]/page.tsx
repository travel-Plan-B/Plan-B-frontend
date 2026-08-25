import type { Metadata } from "next";

import { PlaceDetailPage } from "@/features/recovery/detail/components/place-detail/PlaceDetailPage";

export const metadata: Metadata = {
  title: "추천 장소 상세 | PlanB",
  description:
    "현재 일정에 맞는 대체 장소의 상세 정보와 AI 추천 이유를 확인하세요.",
};

export default async function DetailRecoveryPlaceDetailRoute({
  params,
}: PageProps<"/recovery/detail/place/[placeId]">) {
  const { placeId } = await params;
  return <PlaceDetailPage placeId={placeId} />;
}
