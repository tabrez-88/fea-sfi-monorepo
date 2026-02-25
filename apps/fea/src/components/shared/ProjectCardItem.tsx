import { Gift, Heart, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type ProjectStatus = 'Funded' | 'Closed' | string

export interface ProjectCardData {
  id: number
  image: string
  title: string
  badges: ('Trending' | 'New')[]
  category: { emoji: string; label: string }
  location: string
  status: ProjectStatus
  statusColor?: string
  description: string
  perksAvailable: boolean
  verifiedParticipant: boolean
  progress: number
  entryFrom: number
}

export default function ProjectCardItem({ project }: { project: ProjectCardData }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="relative h-63.5 w-full rounded-xl overflow-hidden">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {project.badges.map((badge) => (
            <Badge
              key={badge}
              className="bg-black/70 text-white backdrop-blur-sm text-xs"
            >
              {badge === 'Trending' && <TrendingUp className="size-3" />}
              {badge === 'New' && <Sparkles className="size-3" />}
              {badge}
            </Badge>
          ))}
        </div>
        <button className="absolute top-3 right-3 size-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
          <Heart className="size-4 text-white" />
        </button>
      </div>

      <div className="p-6 flex flex-col w-full flex-1 gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold truncate">{project.title}</h3>
          <div className="flex items-center text-muted-foreground font-bold gap-2 text-sm">
            <span>{project.category.emoji} {project.category.label}</span>
            <Separator orientation="vertical" />
            <span>{project.location}</span>
            <Separator orientation="vertical" />
            <span className={project.statusColor || ''}>
              {project.status}
            </span>
          </div>
        </div>
        <Separator />
        <p className="text-sm h-full text-muted-foreground line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-col gap-4 justify-between size-full">
          <div className="flex flex-col gap-1.5 text-sm">
            {project.perksAvailable && (
              <div className="flex items-center gap-2">
                <Gift className="size-4" />
                <span>Perks Available</span>
              </div>
            )}
            {project.verifiedParticipant && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4" />
                <span>Verified Participant</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-auto">
            <span className="text-sm font-bold">Progress:</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-sm">{project.progress}%</span>
          </div>
        </div>

        <div className="flex items-center h-12 w-full gap-4 relative">
          <div className='flex flex-col flex-nowrap'>
            <p className="text-sm font-bold text-nowrap">Entry from</p>
            <p className="text-lg font-bold">${project.entryFrom}</p>
          </div>
          <Button variant="link" asChild className="rounded-md h-full flex-1">
            <Link href={`/projects/${project.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
