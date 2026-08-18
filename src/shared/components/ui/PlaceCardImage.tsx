"use client";

import Image from "next/image";
import { useState } from "react";

import { ImagePlaceholder } from "@/shared/components/ui/ImagePlaceholder";

interface PlaceCardImageProps {
  imageUrl?: string;
  imageAlt: string;
  sizes: string;
}

type LoadableImageProps = Required<PlaceCardImageProps>;

function LoadableImage({ imageUrl, imageAlt, sizes }: LoadableImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <PlaceImagePlaceholder />;
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

function PlaceImagePlaceholder() {
  return (
    <ImagePlaceholder className="rounded-none">
      <span className="text-xs">이미지 없음</span>
    </ImagePlaceholder>
  );
}

export function PlaceCardImage({
  imageUrl,
  imageAlt,
  sizes,
}: PlaceCardImageProps) {
  if (!imageUrl) {
    return <PlaceImagePlaceholder />;
  }

  return (
    <LoadableImage
      key={imageUrl}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      sizes={sizes}
    />
  );
}
