import Image from 'next/image'
import React from 'react'

export interface WhatSfiIsProps {
  subtitle: string
  description: React.ReactNode
  footnote: string
}

export default function WhatSfiIs({ subtitle, description, footnote }: WhatSfiIsProps) {
  return (
    <section className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
      <p className="text-xl lg:text-2xl font-extralight leading-relaxed max-w-3xl">
        {description}
      </p>

      {/* Flow Diagram */}
      <div className="relative rounded-3xl overflow-hidden h-64 lg:h-80">
        <Image
          src="/assets/studio2.jpg"
          alt="SFI Architecture diagram"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <div className="bg-card border border-border rounded-xl px-8 py-4 text-center font-bold shadow">
            FEA
          </div>
          <div className="bg-foreground text-background rounded-xl px-8 py-4 text-center font-bold shadow-lg">
            SFI
          </div>
          <div className="bg-card border border-border rounded-xl px-8 py-4 text-center font-bold shadow">
            CHAIN
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground max-w-3xl">
        {footnote}
      </p>
    </section>
  )
}
