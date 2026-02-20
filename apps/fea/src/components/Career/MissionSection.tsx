export interface MissionCard {
  number: string
  title: string
  description: string
}

export interface MissionSectionProps {
  subtitle: string
  title: React.ReactNode
  cards: MissionCard[]
}

export default function MissionSection({ subtitle, title, cards }: MissionSectionProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground font-bold uppercase">{subtitle}</p>
        <h2 className="text-2xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((item) => (
          <div
            key={item.number}
            className="border border-border rounded-2xl p-6 flex flex-col gap-3"
          >
            <p className="text-sm text-muted-foreground">{item.number}</p>
            <h4 className="font-bold">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
