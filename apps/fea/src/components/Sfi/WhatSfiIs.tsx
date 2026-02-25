import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import Container from '../shared/Container'

export interface WhatSfiIsProps {
  subtitle: string
  description: React.ReactNode
  footnote: string
}

export default function WhatSfiIs({ subtitle, description, footnote }: WhatSfiIsProps) {
  return (
    <Container orientation='vertical' gap='sm'>
      <p className="text-muted-foreground text-[20px] font-bold uppercase">{subtitle}</p>
      <p className="text-xl lg:text-[32px] font-extralight leading-thight">
        {description}
      </p>

      <div className="relative rounded-3xl overflow-hidden h-64 lg:h-80">
        <Image
          src="/assets/studio2.jpg"
          alt="SFI Architecture diagram"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <div className="bg-card w-58.5 h-28.25 border border-border flex justify-center items-center text-[20px] px-8 py-4 text-center font-bold shadow">
            <span>FEA</span>
          </div>
          <ArrowRight className="size-6 text-muted-foreground" />
          <div className="bg-foreground w-58.5 h-28.25 text-background flex justify-center items-center text-[20px] px-8 py-4 text-center font-bold shadow-lg">
            <span>SFI</span>
          </div>
          <ArrowRight className="size-6 text-muted-foreground" />
          <div className="bg-card w-58.5 h-28.25 border border-border flex justify-center items-center text-[20px] px-8 py-4 text-center font-bold shadow">
            <span>CHAIN</span>
          </div>
        </div>
      </div>

      <p className="text-[32px] text-muted-foreground">
        {footnote}
      </p>
    </Container>
  )
}
