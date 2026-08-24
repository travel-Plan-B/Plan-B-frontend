import type { TagVariant } from "@/shared/components/ui/Tag";

const CATEGORY_TAG_VARIANT: Record<string, TagVariant> = {
  관광: "purple",
  관광지: "purple",
  음식점: "pink",
  식당: "pink",
  카페: "orange",
  숙박: "mint",
};

export function getCategoryTagVariant(categoryTag: string): TagVariant {
  return CATEGORY_TAG_VARIANT[categoryTag] ?? "gray";
}
