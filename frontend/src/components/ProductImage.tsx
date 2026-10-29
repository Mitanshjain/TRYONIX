
"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type ProductImageProps = {
  src: string | null;
  alt: string;
};

export default function ProductImage({
  src,
  alt,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const hasError = !src || failedSrc === src;

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#242424] text-white/35">
        <ImageOff size={28} strokeWidth={1} />

        <span className="text-[10px] tracking-[0.2em]">
          IMAGE UNAVAILABLE
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={() => setFailedSrc(src)}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}
