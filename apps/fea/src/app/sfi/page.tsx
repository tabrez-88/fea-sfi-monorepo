import SfiHero from '@/components/Sfi/SfiHero'
import SfiProcess from '@/components/Sfi/SfiProcess'
import WhatSfiDoes from '@/components/Sfi/WhatSfiDoes'
import WhatSfiIs from '@/components/Sfi/WhatSfiIs'
import Banners from '@/components/shared/Banners'
import { Separator } from '@/components/ui/separator'

const heroSteps = [
  { icon: 'file-text', title: 'Input', description: 'Revenue reports' },
  { icon: 'cpu', title: 'Process', description: 'Rules · calculations · logs' },
  { icon: 'hard-drive', title: 'Output', description: 'Settlement records · statements' },
  { icon: 'shield-check', title: 'Proof', description: 'Immutable on-chain receipts' },
]

const sfiDoes = [
  'Revenue ingestion by reporting period',
  'Deterministic settlement calculations',
  'Allocation ledgers and statements',
  'Cryptographic proof of settlement records',
]

const principles = [
  {
    title: 'Transparency',
    description: 'Every allocation is traceable, period by period.',
  },
  {
    title: 'Determinism',
    description: 'Identical inputs always produce identical settlement outcomes.',
  },
  {
    title: 'Integrity',
    description: 'Every settlement is backed by immutable proof.',
  },
]

const processSteps = [
  {
    number: '01',
    icon: 'download',
    title: 'Revenue Ingestion',
    description:
      'Manual upload (PDF, CSV, screenshots) or direct API feeds. EFI normalizes and validates all income streams.',
  },
  {
    number: '02',
    icon: 'hard-drive',
    title: 'Settlement Engine',
    description:
      'Runs recoup logic, waterfall tiers, bonus conditions, multi-party splits. Outputs transparent ledgers for every participant.',
  },
  {
    number: '03',
    icon: 'hash',
    title: 'On-Chain Proof',
    description:
      'SFI writes a tamper-proof SHA-256 digest to blockchain: deal_id | run_id | total_amount | timestamp | hash.',
  },
]

export default function SfiPage() {
  return (
    <div>
      <SfiHero
        title="SFI"
        subtitle={
          <>
            Off-chain <span className="font-bold">settlement.</span>
            <br />
            On-chain <span className="font-bold">proof.</span>
          </>
        }
        description="An off-chain deterministic settlement engine for revenue participation, with immutable on-chain proof."
        ctaHref="/sfi#process"
        ctaLabel="Explore SFI"
        steps={heroSteps}
      />
      <Separator />
      <WhatSfiIs
        subtitle="What SFI Is"
        description={
          <>
            SFI is the <span className="font-bold">settlement and verification layer</span>{' '}
            powering revenue participation on FEA. It calculates allocations based on reported
            revenue and predefined rules, and produces verifiable settlement records over time.
          </>
        }
        footnote="It calculates allocations based on reported revenue and predefined rules, and produces verifiable settlement records over time."
      />
      <Separator />
      <WhatSfiDoes
        subtitle="What SFI Does"
        title={
          <>
            A modern platform for <span className="font-bold">creative</span> projects
          </>
        }
        items={sfiDoes}
        principles={principles}
      />
      <Separator />
      <SfiProcess
        subtitle="The Process"
        title={
          <>
            How <span className="font-bold">SFI</span> Works
          </>
        }
        description="Three-step process from revenue ingestion to immutable proof"
        processImage="/assets/studio2.jpg"
        steps={processSteps}
      />
      <Banners />
    </div>
  )
}
