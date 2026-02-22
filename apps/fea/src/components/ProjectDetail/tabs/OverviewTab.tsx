'use client'

import { Minus, Play, Plus } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Separator } from '@/components/ui/separator'

import type { SocialIconType } from '../SocialIcon'
import SocialIcon from '../SocialIcon'

export interface TimelineItem {
  range: string
  label: string
}

export interface TeamMember {
  image: string
  name: string
  role: string
  bio: string
  socials: { type: SocialIconType; href: string }[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface OverviewTabProps {
  timelineItems: TimelineItem[]
  teamMembers: TeamMember[]
  faqItems: FaqItem[]
  risks: string[]
}

export default function OverviewTab({
  timelineItems,
  teamMembers,
  faqItems,
  risks,
}: OverviewTabProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="flex flex-col gap-8">
      {/* Pitch / Vision */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> PITCH / VISION
        </h3>
        <p className="font-bold text-sm">
          A modern supernatural thriller that turns grief into a haunted house.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Horror Section is a contained, character-driven feature film set in an abandoned wing of a
          hospital slated for demolition. After her brother&apos;s death, a paramedic returns to the
          hospital for one final shift and discovers the building is recording people&apos;s last
          moments— then replaying them for the living.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We&apos;re building a film with elevated tension, a lean production plan, and a clear
          audience lane: fans of psychological horror with strong emotional core.
        </p>

        {/* Teaser Trailer */}
        <p className="font-bold text-sm">Teaser Trailer</p>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
          <Image src="/assets/studio2.jpg" alt="Teaser trailer" fill className="object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-16 rounded-full bg-white/80 flex items-center justify-center">
              <Play className="size-7 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Why This Matters */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> WHY THIS MATTERS
        </h3>
        <p className="font-bold text-sm">Why This Matters</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Horror has always been a home for emotional storytelling. Horror Section is built to
          deliver scares while exploring grief and memory—creating a film that&apos;s both
          entertaining and resonant. We want supporters and investors to feel close to the process,
          from casting and production to festival strategy and release.
        </p>
      </div>

      <Separator />

      {/* Current Stage */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> CURRENT STAGE
        </h3>
        <p className="font-bold text-sm">Current phase of the project: Pre-Production</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creating a film that&apos;s both entertaining and resonant. We want supporters and
          investors to feel close to the process, from casting and production to festival strategy
          and release.
        </p>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> TIMELINE
        </h3>
        <div className="flex flex-col gap-3">
          {timelineItems.map((item) => (
            <div key={item.range} className="flex gap-4 items-start">
              <div className="flex flex-col items-center pt-1.5">
                <div className="size-2 rounded-full bg-muted-foreground shrink-0" />
              </div>
              <div>
                <p className="text-sm font-bold">{item.range}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Chart Placeholder */}
        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0a0a2e]">
          <Image
            src="/assets/studio2.jpg"
            alt="Timeline chart"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-xs">Project Timeline Chart</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold">Note</p>
          <p className="text-sm text-muted-foreground">
            Dates are targets and may shift due to talent availability, permitting, and delivery
            requirements.
          </p>
        </div>
      </div>

      <Separator />

      {/* Team */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> TEAM
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col gap-3">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-muted">
                <Image src={member.image} alt={member.name} fill className="object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
                <p className="text-xs text-muted-foreground mt-1">{member.bio}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.socials.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    className="size-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <SocialIcon type={social.type} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* FAQ */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> FAQ
        </h3>
        <div className="flex flex-col">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border-b border-border">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex items-center justify-between w-full py-4 text-left"
              >
                <span className="text-sm font-bold">Q. {item.question}</span>
                {openFaq === idx ? (
                  <Minus className="size-4 shrink-0 ml-4 text-muted-foreground" />
                ) : (
                  <Plus className="size-4 shrink-0 ml-4 text-muted-foreground" />
                )}
              </button>
              {openFaq === idx && (
                <p className="text-sm text-muted-foreground pb-4 pr-8 leading-relaxed">
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Risks & Uncertainties */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <span>»</span> RISKS & UNCERTAINTIES
        </h3>
        <ul className="flex flex-col gap-2 pl-4">
          {risks.map((risk) => (
            <li key={risk} className="text-sm text-muted-foreground list-disc">
              {risk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
