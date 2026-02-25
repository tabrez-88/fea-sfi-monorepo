import Image from 'next/image'
import React from 'react'

import Container from '../shared/Container'

export interface PlatformFeaturesProps {
  subtitle: string
  title: React.ReactNode
  features: { image: string; title: string; description: string }[]
  missionText: React.ReactNode
  stats: { value: string; label: string }[]
}

export default function PlatformFeatures({ subtitle, title, features, missionText, stats }: PlatformFeaturesProps) {
  return (
    <Container orientation='vertical'>
      <div className="flex flex-col gap-2">
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
      <div className='flex flex-col gap-12'>
        <div className="max-w-212.25">
          <p className="text-xl lg:text-[32px] font-light leading-relaxed">
            {missionText}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-border rounded-md p-6 gap-4 flex flex-col"
            >
              <p className="text-[32px] font-extralight leading-none">{stat.value}</p>
              <p className="text-[20px] font-bold leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Container >
  )
}
