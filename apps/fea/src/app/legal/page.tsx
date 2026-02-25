import LegalContent, { LegalSectionData } from '@/components/Legal/LegalContent'
import LegalSidebar from '@/components/Legal/LegalSidebar'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import { Separator } from '@/components/ui/separator'

const loremLong =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.'

const loremShort =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'

const riskBullets = [
  'Projects may not generate revenue',
  'Timelines may change or be delayed',
  'Market demand is unpredictable',
  'Operational and creative risks exist',
]

const sections: LegalSectionData[] = [
  {
    id: 'risk-disclosure',
    title: 'Risk Disclosure',
    blocks: [{ type: 'paragraph', text: loremLong }],
  },
  {
    id: 'general-risk',
    title: 'General Risk',
    blocks: [
      { type: 'paragraph', text: loremShort },
      { type: 'bullets', items: riskBullets },
      { type: 'paragraph', text: loremLong },
    ],
  },
  {
    id: 'investment-specific-risks',
    title: 'Investment-specific Risks',
    blocks: [
      { type: 'paragraph', text: loremShort },
      { type: 'paragraph', text: loremLong },
    ],
  },
  {
    id: 'platform-risks',
    title: 'Platform Risks',
    blocks: [
      { type: 'paragraph', text: loremLong },
      { type: 'bullets', items: riskBullets },
    ],
  },
  {
    id: 'investment-disclosures',
    title: 'Investment Disclosures',
    blocks: [{ type: 'paragraph', text: loremLong }],
  },
  {
    id: 'perks-disclaimers',
    title: 'Perks Disclaimers',
    blocks: [
      { type: 'paragraph', text: loremShort },
      { type: 'bullets', items: riskBullets },
      { type: 'paragraph', text: loremLong },
    ],
  },
  {
    id: 'final-notice',
    title: 'Final Notice',
    blocks: [
      { type: 'paragraph', text: loremShort },
      { type: 'paragraph', text: loremLong },
    ],
  },
]

export default function LegalPage() {
  return (
    <div>
      <Container orientation="vertical">
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-bold uppercase">Legal & Disclosures</p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
            Important information about using <span className="font-bold">FEA</span> and
            participating in projects
          </h1>
        </section>
      </Container>
      <Separator />
      <Container>
        <section className="flex gap-12">
          <LegalContent sections={sections} />
          <LegalSidebar sections={sections} />
        </section>
      </Container>
      <Banners />
    </div>
  )
}
