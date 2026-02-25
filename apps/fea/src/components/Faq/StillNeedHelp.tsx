import { CircleQuestionMark } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { Separator } from '../ui/separator'


export default function StillNeedHelp() {
  return (
    <section className="border border-border rounded-md mx-4 md:mx-8 lg:mx-37.5 lg:mt-6 lg:mb-20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className='flex items-center gap-2'>
        <div className="flex size-10.5 aspect-square bg-muted justify-center items-center rounded-md">
          <CircleQuestionMark className="size-5 " />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-bold">Still Need Help?</p>
          <p className="text-sm text-muted-foreground/80">
            If your question isn&apos;t covered here, contact our team.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild size="lg">
          <Link href="/contact">Send a Message</Link>
        </Button>
        <Separator orientation="vertical" className="hidden md:block data-[orientation=vertical]:h-12" />
        <span className="text-sm text-muted-foreground/80">hellofea.ask@funkyland.io</span>
      </div>
    </section>
  )
}
