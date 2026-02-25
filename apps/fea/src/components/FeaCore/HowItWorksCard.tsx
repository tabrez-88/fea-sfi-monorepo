import { ArrowRight, CircleCheck } from 'lucide-react'


export interface HowItWorksCardProps {
  features: string[]
  comingSoonTitle: string
  comingSoonDescription: string
}

export default function HowItWorksCard({
  features,
  comingSoonTitle,
  comingSoonDescription,
}: HowItWorksCardProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 border border-border rounded-md p-6 flex flex-col gap-12">
        <h3 className="text-xl font-bold">How FEA Core Works</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-foreground flex-1 text-background bg-linear-to-br from-[#313131] from-60% to-[#808080] rounded-md px-5 py-3 text-sm font-bold text-center">
            FEA Platform<br />Activity
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="bg-foreground flex-1 text-background bg-linear-to-br from-[#313131] from-60% to-[#808080] rounded-md px-5 py-3 text-sm font-bold text-center">
            Core<br />Participation<br />Pool
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="bg-foreground flex-1 text-background bg-linear-to-br from-[#313131] from-60% to-[#808080] rounded-md px-5 py-3 text-sm font-bold text-center">
            Core<br />Participants
          </div>
        </div>

        <ul className="flex flex-col gap-3 w-full">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CircleCheck fill='black' color='white' className="size-6 shrink-0" />
              <span className="text-[20px] font-bold">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-border rounded-md p-6 flex flex-col gap-2 lg:col-span-2 h-fit">
        <h3 className="text-[20px] font-bold leading-none">{comingSoonTitle}</h3>
        <p className="text-sm text-muted-foreground/80">{comingSoonDescription}</p>
      </div>
    </section>
  )
}
