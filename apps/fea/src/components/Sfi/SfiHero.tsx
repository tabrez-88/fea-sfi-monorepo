import { Cpu, FileText, HardDrive, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

import Container from '../shared/Container'

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
    <Container className="relative bg-muted overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 justify-between w-full">
        <div className="flex flex-col gap-12 lg:w-1/2">
          <div className="flex flex-col gap-6 lg:w-full justify-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-5xl lg:text-[128px] font-extralight tracking-tight">{title}</h1>
              <h2 className="text-2xl lg:text-[40px] font-extralight leading-tight">
                {subtitle}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground/80 max-w-sm">
              {description}
            </p>
          </div>
          <div>
            <Button asChild size="lg">
              <Link href={ctaHref as never}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col justify-center">
          <div className="flex flex-col gap-4 bg-card rounded-2xl p-6 shadow-lg border border-border">
            {steps.map((step) => (
              <div key={step.title} className="flex leading-none items-start gap-2">
                {iconMap[step.icon]}
                <div className='flex flex-col gap-2'>
                  <p className="font-bold text-[20px]">{step.title}</p>
                  <p className="text-muted-foreground/80">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
