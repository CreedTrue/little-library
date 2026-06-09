"use client"

import Image from "next/image"

interface CoverImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
}

export function CoverImage({ src, alt, fill, className }: CoverImageProps) {
  if (src.startsWith("http")) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
      />
    )
  }

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} />
  }

  return <Image src={src} alt={alt} width={0} height={0} className={className} />
}
