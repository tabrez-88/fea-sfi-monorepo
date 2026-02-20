'use client'

import { CheckCircle, Info } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export interface PerkTier {
  price: string
  perks: string[]
}

export interface SupportSidebarProps {
  goal: number
  minimumSupport: number
  supporters: number
  progress: number
  raised: number
  target: number
  perkTiers: PerkTier[]
}

function formatNumber(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function SupportSidebar({
  goal,
  minimumSupport,
  supporters,
  progress,
  raised,
  target,
  perkTiers,
}: SupportSidebarProps) {
  const [selectedPerk, setSelectedPerk] = useState(0)

  return (
    <aside className="lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24 flex flex-col gap-4">
      {/* Support Card */}
      <div className="border border-border rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="font-bold text-lg">Support This Project</h3>
        <p className="text-sm text-muted-foreground">
          Support the project through non-financial perks. No financial returns are offered.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Project Goal:</span>
            <span className="text-sm">${formatNumber(goal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Minimum Support Required:</span>
            <span className="text-sm">${formatNumber(minimumSupport)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Supporter:</span>
            <span className="text-sm">{supporters}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Progress:</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-foreground h-2 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            ${formatNumber(raised)} Raised of ${formatNumber(target)}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-start gap-2">
            <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              If the minimum support isn&apos;t met, contributions will be refunded.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Progress reflects combined funding.
            </p>
          </div>
        </div>
      </div>

      {/* Perk Tiers */}
      {perkTiers.map((tier, idx) => (
        <div
          key={tier.price}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedPerk(idx)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelectedPerk(idx)
            }
          }}
          className={`border rounded-2xl p-6 flex flex-col gap-3 text-left transition-colors cursor-pointer ${
            selectedPerk === idx ? 'border-foreground' : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-bold">{tier.price}</span>
            <CheckCircle
              className={`size-5 ${
                selectedPerk === idx ? 'text-foreground' : 'text-muted-foreground'
              }`}
            />
          </div>
          <ul className="flex flex-col gap-1">
            {tier.perks.map((perk) => (
              <li key={perk} className="text-sm text-muted-foreground flex items-start gap-2">
                <span>🎁</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          {selectedPerk === idx && (
            <Button className="w-full rounded-xl mt-2">Support This Project</Button>
          )}
        </div>
      ))}

      {/* Support Without Perks */}
      <div className="border border-border rounded-2xl p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-bold">Support Without Perks</span>
          <CheckCircle className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Support the project through non-financial perks. No financial returns are offered.
        </p>
      </div>

      {/* Additional Access */}
      <div className="border border-border rounded-2xl p-6 flex flex-col gap-2">
        <span className="font-bold">Additional Access Information</span>
        <p className="text-sm text-muted-foreground">
          Additional participation options may be available after login and eligibility
          verification.
        </p>
      </div>
    </aside>
  )
}
