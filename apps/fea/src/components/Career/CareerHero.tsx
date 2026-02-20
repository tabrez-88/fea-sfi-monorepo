import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface CareerHeroProps {
  subtitle: string
  title: React.ReactNode
  description: string
  heroImage: string
  ctaHref: string
  ctaLabel: string
}

export default function CareerHero({
  subtitle,
  title,
  description,
  heroImage,
  ctaHref,
  ctaLabel,
}: CareerHeroProps) {
  return (
    <>
      {/* Header */}
      <section className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
        <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
          {title}
        </h1>
      </section>

      <Separator />

      {/* Hero Image */}
      <section className="flex flex-col gap-8">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
          <Image
            src={heroImage}
            alt="FEA team"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-muted-foreground max-w-xl">{description}</p>
          <Button asChild size="lg" className="rounded-xl shrink-0">
            <Link href={ctaHref as never}>{ctaLabel}</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
