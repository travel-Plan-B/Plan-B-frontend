import { SimpleRecoveryRecommendPage } from "@/features/recovery/simple/SimpleRecoveryRecommendPage";

export default async function SimpleRecoveryRecommendRoute({
  searchParams,
}: PageProps<"/recovery/simple/recommend">) {
  const { selectedPlaceId } = await searchParams;

  return (
    <SimpleRecoveryRecommendPage
      selectedPlaceId={
        typeof selectedPlaceId === "string" ? selectedPlaceId : undefined
      }
    />
  );
}
