import { Download, HardDrive, Hash } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

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
    <section id="process" className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h3 className="text-3xl lg:text-4xl font-extralight leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="relative lg:w-1/2 aspect-video rounded-2xl overflow-hidden bg-foreground">
          <Image
            src={processImage}
            alt="SFI Process diagram"
            fill
            className="object-cover opacity-40"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="border border-border rounded-2xl p-6 flex flex-col gap-4"
          >
            <p className="text-5xl font-extralight text-muted-foreground/40">{step.number}</p>
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
              {iconMap[step.icon]}
            </div>
            <h4 className="font-bold text-lg">{step.title}</h4>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
