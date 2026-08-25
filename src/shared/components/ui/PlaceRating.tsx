import { Star } from "lucide-react";

export function PlaceRating({
  value,
  reviewCount,
}: {
  value: number;
  reviewCount?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-neutral-900"
      aria-label={`평점 ${value.toFixed(1)}`}
    >
      <Star
        aria-hidden="true"
        className="size-4 fill-yellow-500 text-yellow-500"
      />
      {value.toFixed(1)}
      {reviewCount !== undefined && (
        <span className="font-normal text-neutral-700">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </span>
  );
}
