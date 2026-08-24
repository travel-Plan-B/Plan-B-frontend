"use client";

import Image from "next/image";
import { useState } from "react";

import { ImagePlaceholder } from "@/shared/components/ui/ImagePlaceholder";

interface PlaceImageProps {
  imageUrl?: string;
  imageAlt: string;
  sizes: string;
  /** 작은 썸네일 등 라벨 텍스트가 안 맞는 곳에서 false로 끈다. 기본 true. */
  showFallbackLabel?: boolean;
}

type LoadableImageProps = Required<PlaceImageProps>;

function LoadableImage({
  imageUrl,
  imageAlt,
  sizes,
  showFallbackLabel,
}: LoadableImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <PlaceImagePlaceholder showFallbackLabel={showFallbackLabel} />;
  }

  return (
    <Image
      src={imageUrl}
      alt={imageAlt}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function PlaceImagePlaceholder({
  showFallbackLabel,
}: {
  showFallbackLabel: boolean;
}) {
  return (
    <ImagePlaceholder className="rounded-none">
      {showFallbackLabel && <span className="text-xs">이미지 없음</span>}
    </ImagePlaceholder>
  );
}

export function PlaceImage({
  imageUrl,
  imageAlt,
  sizes,
  showFallbackLabel = true,
}: PlaceImageProps) {
  if (!imageUrl) {
    return <PlaceImagePlaceholder showFallbackLabel={showFallbackLabel} />;
  }

  return (
    <LoadableImage
      key={imageUrl}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      sizes={sizes}
      showFallbackLabel={showFallbackLabel}
    />
  );
}
