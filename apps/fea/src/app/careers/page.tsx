import CareerHero from '@/components/Career/CareerHero'
import CultureSection from '@/components/Career/CultureSection'
import MissionSection, { MissionCard } from '@/components/Career/MissionSection'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import { Separator } from '@/components/ui/separator'

const missionCards: MissionCard[] = [
  {
    number: '1.',
    title: 'Build Real Infrastructure',
    description:
      'We are not building a content app. We are building financial and settlement infrastructure for the creative economy.',
  },
  {
    number: '2.',
    title: 'Long-Term Thinking',
    description: 'We prioritize durability over hype.',
  },
  {
    number: '3.',
    title: 'Regulatory-First Approach',
    description:
      'Work at the intersection of entertainment, fintech, and compliance.',
  },
]

export default function CareerPage() {
  return (
    <div>
      <Container>
        <CareerHero
          subtitle="Career"
          title={
            <>
              Build the Infrastructure for the <span className="font-bold">Future</span> of
              Entertainment
            </>
          }
          description="FEA is building a regulated platform that enables global audiences to support and participate in entertainment projects through structured, transparent revenue participation models."
          heroImage="/assets/studio2.jpg"
          ctaHref="#open-roles"
          ctaLabel="View Open Roles"
        />
      </Container>
      <Separator />
      <Container>
        <MissionSection
          subtitle="Our Mission"
          title={
            <>
              We believe the future of entertainment financing must be{' '}
              <span className="font-bold">compliant</span>,{' '}
              <span className="font-bold">transparent</span>, and aligned with creators and
              audiences.
            </>
          }
          cards={missionCards}
        />
      </Container>
      <Separator />
      <Container>
        <CultureSection
          subtitle="Our Culture"
          title={
            <>
              Built on <span className="font-bold">Discipline</span>.
              <br />
              Driven by <span className="font-bold">Purpose</span>
            </>
          }
          description="We operate at the intersection of entertainment and regulated finance, where precision, accountability, and long-term thinking define how we build and how we work."
          image="/assets/studio2.jpg"
          ctaHref="#open-roles"
          ctaLabel="View Open Roles"
        />
      </Container>
      <Banners />
    </div>
  )
}
