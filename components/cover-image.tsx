"use client"

interface CoverImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
}

export function CoverImage({ src, alt, fill, className }: CoverImageProps) {
  const imageSrc = src.startsWith("/covers/") ? `/api${src}` : src

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={fill ? { width: "100%", height: "100%", objectFit: "cover" } : undefined}
    />
  )
}
