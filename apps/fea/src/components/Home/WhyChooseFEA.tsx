import { CircleCheck, Gift, Hash, LockKeyhole } from 'lucide-react'

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
    <section className='flex flex-col gap-10'>
      <div className="grid grid-cols-3 gap-6">
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <Gift className="size-6" />
          </div>
          <p className="text-xl font-bold">Exclusive Perks & Access</p>
          <p className="text-muted-foreground leading-relaxed">Get closer to the action. Unlock behind-the-scenes content, limited collectibles, and premiere invites just for backers.</p>
        </div>
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <LockKeyhole className="size-6" />
          </div>
          <p className="text-xl font-bold">Verified Participant</p>
          <p className="text-muted-foreground leading-relaxed">Unlock advanced support tiers. Verification grants access to defined contractual structures and deep project engagement.</p>
        </div>
        <div className="flex p-8 flex-col gap-4 border border-[#E5E5E5] rounded-2xl">
          <div className="p-4 shadow-xl rounded-xl w-fit">
            <Hash className="size-6" />
          </div>
          <p className="text-xl font-bold">Transparent Settlement</p>
          <p className="text-muted-foreground leading-relaxed">Powered by SFI Protocol. Smart waterfall logic ensures every distribution is transparent, immutable, and on-time.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 w-full gap-6">
        <ImageGrid />
        <div className="flex flex-col justify-between size-full">
          <div className="flex flex-col gap-4">
            <p className="text-[20px] text-muted-foreground font-bold uppercase">Why Creator & Bakers Choose FEA</p>
            <h4 className="text-[40px] font-extralight leading-tight">A Modern platform for <span className="font-bold">creative</span> projects</h4>
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
    </section>
  )
}
