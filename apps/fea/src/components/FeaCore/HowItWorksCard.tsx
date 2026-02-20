import { ArrowRight, CircleCheckBig } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

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
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* How FEA Core Works */}
      <div className="lg:col-span-2 border border-border rounded-2xl p-8 flex flex-col gap-8">
        <h3 className="text-xl font-bold">How FEA Core Works</h3>

        {/* Flow Diagram */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-foreground text-background rounded-lg px-5 py-3 text-sm font-bold text-center">
            FEA Platform<br />Activity
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="bg-foreground text-background rounded-lg px-5 py-3 text-sm font-bold text-center">
            Core<br />Participation<br />Pool
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="bg-foreground text-background rounded-lg px-5 py-3 text-sm font-bold text-center">
            Core<br />Participants
          </div>
        </div>

        <Separator />

        {/* Features */}
        <ul className="flex flex-col gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <CircleCheckBig className="size-5 shrink-0" />
              <span className="text-sm font-bold">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coming Soon */}
      <div className="border border-border rounded-2xl p-8 flex flex-col gap-3 bg-muted">
        <h3 className="text-lg font-bold">{comingSoonTitle}</h3>
        <p className="text-sm text-muted-foreground">{comingSoonDescription}</p>
      </div>
    </section>
  )
}
