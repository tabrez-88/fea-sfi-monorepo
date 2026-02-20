import { Clock, Users } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface StudioInfoBarProps {
  studio: { name: string; location: string; logo: string }
  supporters: number
  closingDate: string
}

export default function StudioInfoBar({ studio, supporters, closingDate }: StudioInfoBarProps) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <Avatar className="size-8">
          <AvatarImage src={studio.logo} />
          <AvatarFallback>{studio.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-bold">{studio.name}</p>
          <p className="text-xs text-muted-foreground">{studio.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-bold">Supporter</p>
          <p className="text-xs text-muted-foreground">{supporters}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-bold">Closing Date</p>
          <p className="text-xs text-muted-foreground">{closingDate}</p>
        </div>
      </div>
    </div>
  )
}
