import { CircleCheck } from 'lucide-react'
import React from 'react'

import Container from '../shared/Container'

export interface WhatSfiDoesProps {
  subtitle: string
  title: React.ReactNode
  items: string[]
  principles: { title: string; description: string }[]
}

export default function WhatSfiDoes({ subtitle, title, items, principles }: WhatSfiDoesProps) {
  return (
    <Container orientation='vertical' className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row justify-between gap-8 items-start">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <p className="text-[20px] text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h3 className="text-3xl lg:text-[40px] font-extralight leading-tight">
            {title}
          </h3>
        </div>
        <div >
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[20px] font-bold">
                <span className="size-2 rounded-full bg-foreground shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {principles.map((principle) => (
          <div
            key={principle.title}
            className="border border-border rounded-md p-6 flex flex-col gap-2"
          >
            <div className="flex gap-2 items-center">
              <CircleCheck fill='black' color='white' className="size-6" />
              <h4 className="font-bold text-[20px] leading-none">{principle.title}</h4>
            </div>
            <p className="ml-8 text-muted-foreground/80">{principle.description}</p>
          </div>
        ))}
      </div>
    </Container>
  )
}
