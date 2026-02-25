import { Download, HardDrive, Hash } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import Container from '../shared/Container'

const iconMap: Record<string, React.ReactNode> = {
  'download': <Download className="size-5" />,
  'hard-drive': <HardDrive className="size-5" />,
  'hash': <Hash className="size-5" />,
}

export interface SfiProcessProps {
  subtitle: string
  title: React.ReactNode
  description: string
  processImage: string
  steps: { number: string; icon: string; title: string; description: string }[]
}

export default function SfiProcess({ subtitle, title, description, processImage, steps }: SfiProcessProps) {
  return (
    <Container orientation="vertical" gap="md" className='relative w-full mb-12'>
      <div className="flex flex-col justify-between lg:flex-row gap-8 items-start relative">
        <div className="flex flex-col gap-6 w-full max-w-91">
          <div className="flex flex-col gap-4">
            <p className="text-[20px] text-muted-foreground font-bold uppercase">{subtitle}</p>
            <h3 className="text-3xl lg:text-[40px] font-extralight leading-tight">
              {title}
            </h3>
          </div>
          <p className="text-muted-foreground/80">
            {description}
          </p>
        </div>
        <div className="relative lg:w-128.75 aspect-square overflow-hidden bg-foreground">
          <Image
            src={processImage}
            alt="SFI Process diagram"
            fill
            className="object-cover opacity-40"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 absolute z-10 -bottom-12 w-full">
          {steps.map((step) => (
            <div
              key={step.number}
              className="border border-border bg-white rounded-md p-6 flex flex-col gap-4"
            >
              <p className="text-[96px] leading-none font-extrabold text-muted-foreground/20 ">{step.number}</p>
              <div className="size-12 rounded-md shadow-xl flex items-center justify-center">
                {iconMap[step.icon]}
              </div>
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-[20px] leading-none">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


    </Container>
  )
}
