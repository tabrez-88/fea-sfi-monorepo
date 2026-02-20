import { Briefcase, CircleAlert } from 'lucide-react'
import Link from 'next/link'

export interface JobListingsProps {
  openings: {
    id: string
    title: string
    type: string
  }[]
}

export default function JobListings({ openings }: JobListingsProps) {
  const showOpenings = openings.length > 0

  if (!showOpenings) {
    return (
      <section className="border border-border rounded-2xl p-6 flex items-center gap-4">
        <CircleAlert className="size-5 text-muted-foreground shrink-0" />
        <div>
          <p className="font-bold text-sm">No Current Openings</p>
          <p className="text-sm text-muted-foreground">
            We are not actively hiring at this time. Open roles will be listed here when
            available.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col">
      {openings.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between py-5 border-b border-border"
        >
          <div className="flex items-center gap-4">
            <Briefcase className="size-5 text-muted-foreground" />
            <div>
              <p className="font-bold text-sm">{job.title}</p>
              <p className="text-sm text-muted-foreground">{job.type}</p>
            </div>
          </div>
          <Link
            href={`/career/open-position/${job.id}` as never}
            className="text-sm font-bold hover:underline shrink-0"
          >
            View Details
          </Link>
        </div>
      ))}
    </section>
  )
}
