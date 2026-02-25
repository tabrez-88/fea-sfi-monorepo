import { CircleCheck } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'

import grabMoneyPic from '../../../public/assets/grab-money.png'
import Container from '../shared/Container'
const features = [
  'Designed for long-term creative projects',
  'Transparent record-keeping powered by EFI',
  'Not active at launch',
]

export default function CTA() {
  return (
    <Container py='md'>
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="relative w-full md:w-1/2 aspect-4/5 h-full max-w-md rounded-2xl overflow-hidden">
          <Image
            src={grabMoneyPic}
            alt="Person holding money and laptop"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-6 w-full h-full">
          <div className="flex flex-col gap-4">
            <p className="text-[20px] text-muted-foreground font-bold uppercase">
              Secondary Participation Features
            </p>
            <h4 className="text-[40px] font-extralight leading-tight">
              <span className="font-bold">FEA</span> is exploring future platform
              features that may enable controlled secondary participation
            </h4>
          </div>

          <ul className="flex flex-col gap-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CircleCheck fill='black' color='white' className="size-6 shrink-0" />
                <span className="font-bold">{feature}</span>
              </li>
            ))}
          </ul>

          <div className='mt-auto'>
            <Button size="lg">
              Join Waitlist
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
