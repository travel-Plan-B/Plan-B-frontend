import type { Metadata } from "next";

import { PlaceDetailPage } from "@/features/recovery/simple/place-detail/PlaceDetailPage";

export const metadata: Metadata = {
  title: "아르떼뮤지엄 강릉 | PlanB",
  description:
    "현재 일정에 맞는 대체 장소의 상세 정보와 AI 추천 이유를 확인하세요.",
};

export default function SimpleRecoveryPlaceDetailRoute() {
  return <PlaceDetailPage />;
}
