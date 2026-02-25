import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { Separator } from '../ui/separator'

export interface InfoSectionProps {
  title: string
  items: string[]
  action?: {
    label: string
    href: string
  }
}

export default function InfoSection({ title, items, action }: InfoSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="border col-span-3 border-border rounded-md p-8 flex gap-4">
        <div className="flex flex-col w-full gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-[20px] font-bold">{title}</h3>
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {action && (
          <div className="flex items-center gap-6">
            <Separator orientation="vertical" className="block " />
            <Button variant="outline" size="lg" asChild className="h-fit">
              <Link href={action.href as never}>{action.label}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
