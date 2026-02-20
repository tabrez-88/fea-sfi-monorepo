import { Cpu, FileText, HardDrive, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

const iconMap: Record<string, React.ReactNode> = {
  'file-text': <FileText className="size-4" />,
  'cpu': <Cpu className="size-4" />,
  'hard-drive': <HardDrive className="size-4" />,
  'shield-check': <ShieldCheck className="size-4" />,
}

export interface SfiHeroProps {
  title: string
  subtitle: React.ReactNode
  description: string
  ctaHref: string
  ctaLabel: string
  steps: { icon: string; title: string; description: string }[]
}

export default function SfiHero({ title, subtitle, description, ctaHref, ctaLabel, steps }: SfiHeroProps) {
  return (
    <section className="relative bg-muted rounded-3xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-col gap-6 p-10 lg:p-16 lg:w-1/2 justify-center">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">{title}</h1>
          <h2 className="text-2xl lg:text-3xl font-extralight leading-tight">
            {subtitle}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
          <div>
            <Button asChild size="lg" className="rounded-xl">
              <Link href={ctaHref as never}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="lg:w-1/2 p-10 flex flex-col justify-center">
          <div className="flex flex-col gap-4 bg-card rounded-2xl p-6 shadow-lg border border-border">
            {steps.map((step) => (
              <div key={step.title} className="flex items-start gap-3">
                <div className="mt-0.5">{iconMap[step.icon]}</div>
                <div>
                  <p className="font-bold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
