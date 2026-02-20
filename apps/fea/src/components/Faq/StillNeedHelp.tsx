import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function StillNeedHelp() {
  return (
    <section className="border border-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <p className="font-bold">Still Need Help?</p>
        <p className="text-sm text-muted-foreground">
          If your question isn&apos;t covered here, contact our team.
        </p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/contact">Send a Message</Link>
        </Button>
        <span className="text-sm text-muted-foreground">hellofea.ask@funkyland.io</span>
      </div>
    </section>
  )
}
