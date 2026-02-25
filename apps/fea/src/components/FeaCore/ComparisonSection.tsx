import { Separator } from "../ui/separator"

export interface ComparisonSectionProps {
  title: string
  columns: {
    heading: string
    items: string[]
  }[]
}

export default function ComparisonSection({ title, columns }: ComparisonSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 ">
      <div className="flex flex-col gap-4 lg:col-span-3 border border-border rounded-md p-6 ">
        <h3 className="text-xl font-bold">{title}</h3>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-2">
              <h4 className="font-bold">{column.heading}</h4>
              <ul className="flex flex-col ml-2.5 gap-2">
                {column.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
