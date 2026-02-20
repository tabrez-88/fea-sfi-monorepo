interface InfoRow {
  label: string
  value: string
}

interface ListSection {
  title: string
  items: string[]
}

interface JobDetailInfoProps {
  infoRows: InfoRow[]
  roleOverview: string[]
  sections: ListSection[]
}

export default function JobDetailInfo({ infoRows, roleOverview, sections }: JobDetailInfoProps) {
  return (
    <div className="flex-1 flex flex-col gap-8">
      {/* Info Table */}
      <div className="border border-border rounded-2xl p-6">
        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
          {infoRows.map((row) => (
            <div key={row.label} className="contents">
              <p className="text-sm font-bold">{row.label}</p>
              <p className="text-sm text-muted-foreground">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role Overview */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold">Role Overview</h3>
        {roleOverview.map((paragraph, idx) => (
          <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* List Sections */}
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-3">
          <h3 className="font-bold">{section.title}</h3>
          <ul className="flex flex-col gap-1.5 pl-4">
            {section.items.map((item) => (
              <li key={item} className="text-sm text-muted-foreground list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
