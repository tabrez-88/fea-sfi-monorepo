import Image from 'next/image'
import React from 'react'

export interface PlatformFeaturesProps {
  subtitle: string
  title: React.ReactNode
  features: { image: string; title: string; description: string }[]
}

export default function PlatformFeatures({ subtitle, title, features }: PlatformFeaturesProps) {
  return (
    <section>
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-sm text-muted-foreground font-bold">{subtitle}</p>
        <h3 className="text-3xl lg:text-4xl font-extralight leading-tight max-w-xl">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="relative h-48 bg-muted">
              <Image
                src={feature.image}
                alt={feature.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6 flex flex-col gap-2">
              <h4 className="font-bold text-lg">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
