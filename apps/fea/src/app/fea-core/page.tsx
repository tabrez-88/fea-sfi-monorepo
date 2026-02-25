import ComparisonSection from '@/components/FeaCore/ComparisonSection'
import HowItWorksCard from '@/components/FeaCore/HowItWorksCard'
import InfoSection from '@/components/FeaCore/InfoSection'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import { Separator } from '@/components/ui/separator'

const coreFeatures = [
  'Platform-level revenue participation',
  'Quarterly payouts',
  'Transparent settlement via SFI',
  'No equity ownership',
]

const platformPowers = [
  'Platform services and listings',
  'Transaction and infrastructure usage',
  'Performance-based platform services',
  '(Future) marketplace-related services Original your version',
]

const settlementPoints = [
  'Settlement processing powered by SFI',
  'Verifiable settlement records',
  'Cryptographic proof for auditability',
  'Built for long-term transparency',
]

const riskPoints = [
  'FEA Core does not represent equity ownership in FEA',
  'Participation is subject to eligibility and verification',
  'Availability varies by region and applicable regulations',
  'Details are provided only after verification',
]

const feaCoreComparison = [
  'Platform-level participation',
  'Long-term alignment',
  'Less tied to individual projects',
]

const projectsComparison = [
  'Project-level participation',
  'Outcomes vary by project',
  'Tied to individual project activity',
]

export default function FeaCorePage() {
  return (
    <div>
      <Container orientation="vertical" py='md'>
        <section className="flex flex-col gap-4">
          <p className="text-[20px] text-muted-foreground font-bold uppercase tracking-wide">
            Participate in the Platform Behind the Projects
          </p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-3xl">
            <span className="font-bold">FEA CORE</span> offers access to platform-level
            participation aligned with the growth and activity of the FEA ecosystem.
          </h1>
        </section>
      </Container>
      <Separator />
      <Container orientation='vertical' gap='sm'>
        <HowItWorksCard
          features={coreFeatures}
          comingSoonTitle="Core Access Information (Coming Soon)"
          comingSoonDescription="Platform-level features are currently in development and will require login and eligibility verification when available."
        />
        <InfoSection title="What Powers the FEA Platform" items={platformPowers} />
        <InfoSection
          title="Settlement & Transparency"
          items={settlementPoints}
          action={{ label: 'SFI Overview', href: '/sfi' }}
        />
        <InfoSection title="Risk & Disclosure" items={riskPoints} />
        <ComparisonSection
          title="How FEA Core differs from project participation"
          columns={[
            { heading: 'FEA Core', items: feaCoreComparison },
            { heading: 'Projects', items: projectsComparison },
          ]}
        />
      </Container>
      <Banners />
    </div>
  )
}
