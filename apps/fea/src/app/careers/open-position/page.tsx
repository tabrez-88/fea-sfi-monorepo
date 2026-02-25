import JobListings from '@/components/Career/JobListings'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import { Separator } from '@/components/ui/separator'

const openings = [
  {
    id: 'senior-product-manager',
    title: 'Senior Product Manager – Investment & Compliance',
    type: 'Remote',
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer – Settlement & Financial Systems',
    type: 'Hybrid',
  },
  {
    id: 'compliance-manager',
    title: 'Compliance & Regulatory Operations Manager',
    type: 'Site',
  },
  {
    id: 'creator-partnerships',
    title: 'Creator Partnerships Manager',
    type: 'Hybrid',
  },
]

export default function OpenPositionPage() {
  return (
    <div>
      <Container orientation="vertical">
        {/* Header */}
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-bold uppercase">Career</p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
            Build the Infrastructure for the <span className="font-bold">Future</span> of
            Entertainment
          </h1>
        </section>
      </Container>
      <Separator />
      <Container>
        <JobListings openings={openings} />
      </Container>
      <Banners />
    </div>
  )
}
