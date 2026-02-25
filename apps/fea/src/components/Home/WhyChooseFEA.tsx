import { CircleCheck } from 'lucide-react'

import Container from '../shared/Container'

import ImageGrid from './ImageGrid'

const items = [
  {
    title: "Real Projects, Real Participation",
    description: "Support curated creative projects with verified identities and clear roadmaps, focused on real execution and delivery, not hype-driven speculation."
  },
  {
    title: "Transparent, secure, and community-driven.",
    description: "Every project follows defined participation rules and milestone-based logic, backed by automated structures designed for clarity, accountability, and trust."
  },
  {
    title: "Built for the Long Term",
    description: "No public trading. No speculation. Designed for creators and communities who prioritize sustainability over short-term momentum."
  },
  {
    title: "Creator-First Ecosystem",
    description: "From independent artists to established studios, FEA is built to support sustainable creative growth , not short-term incentives or financial engineering."
  },
  {
    title: "Global by Design",
    description: "Discover creative projects from around the world through intelligent, eligibility-based access."
  }
]

export default function WhyChooseFEA() {
  return (
    <Container py="md">
      <div className="grid md:grid-cols-2 w-full gap-6">
        <ImageGrid />
        <div className="flex flex-col gap-6 md:gap-12 justify-between size-full">
          <div className="flex flex-col gap-4">
            <p className="text-[20px] text-muted-foreground font-bold leading-tight uppercase">Why Creator & Bakers Choose FEA</p>
            <h4 className="text-[40px] font-extralight leading-tight tracking-tight">A Modern platform for <span className="font-bold">creative</span> projects</h4>
          </div>
          <div className="flex flex-col gap-6">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 w-full">
                <div className="flex gap-2 w-full items-center">
                  <CircleCheck fill="#000000" color="white" size={24} />
                  <h5 className="text-[20px] font-bold">{item.title}</h5>
                </div>
                <p className="text-muted-foreground ml-8">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
