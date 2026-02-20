import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export interface ContactHeroProps {
  subtitle: string
  title: React.ReactNode
  description: string
  ctaHref: string
  ctaLabel: string
  heroImage: string
}

export default function ContactHero({
  subtitle,
  title,
  description,
  ctaHref,
  ctaLabel,
  heroImage,
}: ContactHeroProps) {
  return (
    <section className="flex flex-col lg:flex-row items-center gap-12">
      <div className="flex flex-col gap-6 lg:w-1/2">
        <p className="text-[20px] text-muted-foreground font-bold uppercase">{subtitle}</p>
        <h1 className="text-4xl lg:text-5xl font-extralight leading-tight">
          {title}
        </h1>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div>
          <Button asChild size="lg" className="rounded-xl">
            <Link href={ctaHref as never}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>

      <div className="relative lg:w-1/2 aspect-video rounded-2xl overflow-hidden">
        <Image
          src={heroImage}
          alt="Team meeting"
          fill
          className="object-cover"
        />
      </div>
    </section>
  )
}
