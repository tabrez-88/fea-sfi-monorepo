import { CircleCheckBig } from 'lucide-react'
import React from 'react'

export interface WhatSfiDoesProps {
  subtitle: string
  title: React.ReactNode
  items: string[]
  principles: { title: string; description: string }[]
}

export default function WhatSfiDoes({ subtitle, title, items, principles }: WhatSfiDoesProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h3 className="text-3xl lg:text-4xl font-extralight leading-tight">
            {title}
          </h3>
        </div>
        <div className="lg:w-1/2">
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-bold">
                <span className="mt-1.5 size-1.5 rounded-full bg-foreground shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {principles.map((principle) => (
          <div
            key={principle.title}
            className="border border-border rounded-2xl p-6 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <CircleCheckBig className="size-5" />
              <h4 className="font-bold">{principle.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{principle.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
