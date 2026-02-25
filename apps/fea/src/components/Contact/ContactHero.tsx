import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import Container from '../shared/Container'
import { Separator } from '../ui/separator'

export interface ContactHeroProps {
  subtitle: string
  title: React.ReactNode
  description: string
  ctaHref: string
  heroImage: string
}

export default function ContactHero({
  subtitle,
  title,
  description,
  ctaHref,
  heroImage,
}: ContactHeroProps) {
  return (
    <Container py='md' className='justify-between' gap='sm'>
      <div className="flex flex-col gap-4 lg:max-w-91">
        <p className="text-[20px] text-muted-foreground font-bold uppercase">{subtitle}</p>
        <h1 className="text-4xl lg:text-[40px] font-extralight leading-none">
          {title}
        </h1>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div className='mt-auto'>
          <Button asChild size="lg">
            <Link href={ctaHref as never}>
              <p>Mail us</p>
              <Separator orientation='vertical' className='data-[orientation=vertical]:h-4 block' />
              <span className='font-light text-[#989898]'>hellofea.ask@funkyland.io</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-188 max-h-87 aspect-video rounded-md overflow-hidden">
        <Image
          src={heroImage}
          alt="Team meeting"
          fill
          className="object-cover"
        />
      </div>
    </Container>
  )
}
