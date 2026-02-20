import Image from 'next/image'
import React from 'react'

export interface WhySectionProps {
  subtitle: string
  title: React.ReactNode
  description: string
  image: string
  imageAlt: string
}

export default function WhySection({ subtitle, title, description, image, imageAlt }: WhySectionProps) {
  return (
    <section className="bg-muted rounded-3xl p-8 lg:p-16">
      <div className="flex flex-col lg:flex-row items-center gap-10">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h3 className="text-3xl lg:text-4xl font-extralight leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <div className="relative lg:w-1/2 aspect-video rounded-2xl overflow-hidden">
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
