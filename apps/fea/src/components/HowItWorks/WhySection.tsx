import Image from 'next/image'
import React from 'react'

import Container from '../shared/Container'

export interface WhySectionProps {
  subtitle: string
  title: React.ReactNode
  description: string
  image: string
  imageAlt: string
}

export default function WhySection({ subtitle, title, description, image, imageAlt }: WhySectionProps) {
  return (
    <Container className="bg-muted" py='md'>
      <div className="flex flex-col lg:flex-row items-center gap-10">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h3 className="text-3xl lg:text-4xl font-extralight leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground/50 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="relative lg:w-1/2 aspect-video h-54.5 rounded-2xl overflow-hidden">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Container>
  )
}
