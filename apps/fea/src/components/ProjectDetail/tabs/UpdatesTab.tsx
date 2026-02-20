export interface Update {
  date: string
  year: string
  title: string
  content: string
  link?: string
}

export interface UpdatesTabProps {
  updates: Update[]
}

export default function UpdatesTab({ updates }: UpdatesTabProps) {
  return (
    <div className="flex flex-col">
      {updates.map((update, idx) => (
        <div key={idx} className="flex gap-6">
          {/* Date Column */}
          <div className="w-20 shrink-0 text-right pt-1">
            <p className="text-sm font-bold">{update.date}</p>
            <p className="text-xs text-muted-foreground">{update.year}</p>
          </div>

          {/* Timeline Dot & Line */}
          <div className="flex flex-col items-center">
            <div className="size-3 rounded-full bg-muted-foreground mt-2 shrink-0" />
            {idx < updates.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <p className="font-bold text-sm">{update.title}</p>
            {update.content && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {update.content}
              </p>
            )}
            {update.link && (
              <a
                href={update.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold underline mt-1 inline-block"
              >
                {update.link}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
