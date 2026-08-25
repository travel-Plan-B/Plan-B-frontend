import type { Metadata } from "next";

import { SharedTripView } from "@/features/recovery/detail/components/share/SharedTripView";

export const metadata: Metadata = {
  title: "공유된 여행 일정 | PlanB",
  description: "Plan B로 복구한 여행 일정을 확인해보세요.",
};

export default async function RecoveryShareRoute({
  searchParams,
}: PageProps<"/recovery/share">) {
  const { d } = await searchParams;
  return <SharedTripView token={typeof d === "string" ? d : undefined} />;
}
