import { CircleCheck } from 'lucide-react'
import React from 'react'

import Container from '../shared/Container'

export interface ParticipationTypesProps {
  perksTitle: string
  perksFeatures: string[]
  verifiedTitle: string
  verifiedFeatures: string[]
  introText: React.ReactNode
}

export default function ParticipationTypes({
  perksTitle,
  perksFeatures,
  verifiedTitle,
  verifiedFeatures,
  introText,
}: ParticipationTypesProps) {
  return (
    <Container orientation='vertical'>
      <div className="text-center max-w-285 mx-auto">
        <p className="text-xl text-[32px] font-extralight leading-relaxed">
          {introText}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-border rounded-md p-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-[40px] font-light">{perksTitle}</h3>
          <ul className="flex flex-col gap-3">
            {perksFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CircleCheck color='white' fill='black' className="size-5 shrink-0 mt-0.5" />
                <span className="text-[20px] font-bold">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-[40px] font-light">{verifiedTitle}</h3>
          <ul className="flex flex-col gap-3">
            {verifiedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CircleCheck color='white' fill='black' className="size-5 shrink-0 mt-0.5" />
                <span className="text-[20px] font-bold">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  )
}
