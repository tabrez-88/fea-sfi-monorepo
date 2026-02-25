import HeroSection from '@/components/HowItWorks/HeroSection'
import ParticipationTypes from '@/components/HowItWorks/ParticipationTypes'
import PlatformFeatures from '@/components/HowItWorks/PlatformFeatures'
import WhySection from '@/components/HowItWorks/WhySection'
import Banners from '@/components/shared/Banners'

const perksFeatures = [
  'Perks are non-financial benefits',
  'No financial returns',
  'Open to everyone',
  'Designed to support creators directly',
]

const verifiedFeatures = [
  'Access is limited to verified users',
  'Eligibility and regional rules apply',
  'Participation details are shown after verification',
  'Participation options are not publicly visible',
]

const platformFeatures = [
  {
    image: '/assets/studio.jpg',
    title: 'Project Marketplace',
    description:
      'Creators publish vetted entertainment projects with clear participation terms.',
  },
  {
    image: '/assets/studio2.jpg',
    title: 'Perks & Verified Access',
    description:
      'Users can support projects via Perks, or unlock Verified Access for contractual participation.',
  },
  {
    image: '/assets/studio.jpg',
    title: 'Transparent Settlement',
    description:
      'SFI processes revenue data and distributes payouts with verifiable records, powered by on-chain proof.',
  },
]

const stats = [
  { value: '150k+', label: 'Community Member' },
  { value: '80k+', label: 'Verified Backers' },
  { value: '56k+', label: 'Participation Opportunities' },
  { value: '$21.6M+', label: 'Revenue Settled' },
]

export default function HowItWorksPage() {
  return (
    <div>
      <HeroSection
        title={
          <>
            Explore <span className="font-bold">Entertainment.</span>
            <br />
            Support <span className="font-bold">Creativity.</span>
          </>
        }
        description="Your digital gateway to global creative projects. Unlock exclusive perks and verified participation rights through a transparent, community-led platform."
        ctaHref="/discover"
        ctaLabel="Explore Projects"
        image="/assets/studio2.jpg"
        imageAlt="Entertainment projects showcase"
      />
      <ParticipationTypes
        introText={
          <>
            <span className="font-bold">FEA</span> is a global marketplace for entertainment
            projects. Creators publish projects. Supporters choose how to participate.
          </>
        }
        perksTitle="Support Projects with Perks"
        perksFeatures={perksFeatures}
        verifiedTitle="Verified Participation"
        verifiedFeatures={verifiedFeatures}
      />
      <WhySection
        subtitle="Why We Build FEA"
        title={
          <>
            <span className="font-bold">FEA</span> was built to bring transparency and
            accessibility
          </>
        }
        description="FEA is a global platform designed to connect creators and supporters through clear, compliant participation models. FEA was built to bring structure, transparency, and accessibility to how entertainment projects are shared, supported, and managed."
        image="/assets/studio2.jpg"
        imageAlt="Creators collaborating"
      />
      <PlatformFeatures
        subtitle="his"
        title={
          <>
            A marketplace for <span className="font-bold">entertainment projects</span> with
            structured participation
          </>
        }
        features={platformFeatures}
        missionText={
          <>
            <span className="font-bold">FEA</span> aims to become a core platform for entertainment
            projects, with revenue settlement powered by SFI. Our
            focus is long-term sustainability, not short-term speculation.
          </>
        }
        stats={stats}
      />
      <Banners />
    </div>
  )
}
