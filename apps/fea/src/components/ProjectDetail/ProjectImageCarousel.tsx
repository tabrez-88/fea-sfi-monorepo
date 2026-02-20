'use client'

import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export interface ProjectImageCarouselProps {
  images: string[]
  title: string
}

export default function ProjectImageCarousel({ images, title }: ProjectImageCarouselProps) {
  const [currentImage, setCurrentImage] = useState(0)

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
      <Image
        src={images[currentImage] ?? images[0]!}
        alt={title}
        fill
        className="object-cover"
      />
      {images.length > 1 && (
        <button
          onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
        >
          <ChevronRight className="size-5 text-black" />
        </button>
      )}
    </div>
  )
}
