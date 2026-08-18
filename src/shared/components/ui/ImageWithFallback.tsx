"use client";

import Image from "next/image";
import { useState } from "react";

import { ImagePlaceholder } from "./ImagePlaceholder";

export interface ImageWithFallbackProps {
  imageUrl?: string;
  imageAlt: string;
  sizes: string;
}

type LoadableImageProps = Required<ImageWithFallbackProps>;

function LoadableImage({ imageUrl, imageAlt, sizes }: LoadableImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <FallbackPlaceholder />;
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

function FallbackPlaceholder() {
  return (
    <ImagePlaceholder className="rounded-none">
      <span className="text-xs">이미지 없음</span>
    </ImagePlaceholder>
  );
}

// 이미지 로드 실패/URL 없음 상태를 ImagePlaceholder로 대체하는 공용 컴포넌트.
export function ImageWithFallback({
  imageUrl,
  imageAlt,
  sizes,
}: ImageWithFallbackProps) {
  if (!imageUrl) {
    return <FallbackPlaceholder />;
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
