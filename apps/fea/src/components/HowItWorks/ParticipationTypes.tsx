import { CircleCheckBig } from 'lucide-react'
import React from 'react'

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
    <>
      <section className="text-center max-w-3xl mx-auto">
        <p className="text-xl lg:text-2xl font-extralight leading-relaxed">
          {introText}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-border rounded-2xl p-8 lg:p-12">
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold">{perksTitle}</h3>
          <ul className="flex flex-col gap-3">
            {perksFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CircleCheckBig className="size-5 shrink-0 mt-0.5" />
                <span className="text-sm font-bold">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold">{verifiedTitle}</h3>
          <ul className="flex flex-col gap-3">
            {verifiedFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CircleCheckBig className="size-5 shrink-0 mt-0.5" />
                <span className="text-sm font-bold">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
