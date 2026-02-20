import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export interface CultureSectionProps {
  subtitle: string
  title: React.ReactNode
  description: string
  image: string
  ctaHref: string
  ctaLabel: string
}

export default function CultureSection({
  subtitle,
  title,
  description,
  image,
  ctaHref,
  ctaLabel,
}: CultureSectionProps) {
  return (
    <section className="flex flex-col lg:flex-row gap-10">
      <div className="flex flex-col gap-6 lg:w-1/2 justify-center">
        <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
        <h2 className="text-2xl lg:text-[40px] font-extralight leading-tight">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div>
          <Button asChild size="lg" className="rounded-xl">
            <Link href={ctaHref as never}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>

      <div className="relative lg:w-1/2 aspect-video rounded-2xl overflow-hidden">
        <Image
          src={image}
          alt="FEA team culture"
          fill
          className="object-cover"
        />
      </div>
    </section>
  )
}
