import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export interface HeroSectionProps {
  title: React.ReactNode
  description: string
  ctaHref: string
  ctaLabel: string
  image: string
  imageAlt: string
}

export default function HeroSection({ title, description, ctaHref, ctaLabel, image, imageAlt }: HeroSectionProps) {
  return (
    <section className="relative bg-foreground text-background rounded-3xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-col gap-6 p-10 lg:p-16 lg:w-1/2 justify-center">
          <h1 className="text-4xl lg:text-5xl font-extralight leading-tight">
            {title}
          </h1>
          <p className="text-sm text-background/70 max-w-md">
            {description}
          </p>
          <div>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="rounded-xl bg-background text-foreground hover:bg-background/90"
            >
              <Link href={ctaHref as never}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
        <div className="relative lg:w-1/2 h-64 lg:h-auto min-h-75">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
