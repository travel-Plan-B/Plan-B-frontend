import type { Metadata } from "next";
import { PlaceDetailPage } from "@/features/recovery/place-detail/PlaceDetailPage";
import { ROUTES } from "@/shared/config/routes";

export const metadata: Metadata = {
  title: "추천 장소 상세 | PlanB",
  description:
    "현재 일정에 맞는 대체 장소의 상세 정보와 AI 추천 이유를 확인하세요.",
};

export default async function SimpleRecoveryPlaceDetailRoute({
  params,
  searchParams,
}: PageProps<"/recovery/simple/recommend/place/[placeId]">) {
  const { placeId } = await params;
  const { source } = await searchParams;
  return (
    <PlaceDetailPage
      placeId={placeId}
      source={source}
      backHref={ROUTES.RECOVERY_SIMPLE_RECOMMEND}
    />
  );
}
