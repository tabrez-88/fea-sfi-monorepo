import Link from 'next/link'

import { Button } from '@/components/ui/button'

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
    <section className="border border-border rounded-2xl p-8 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-xl font-bold">{title}</h3>
        {action && (
          <Button variant="outline" asChild className="rounded-lg">
            <Link href={action.href as never}>{action.label}</Link>
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
