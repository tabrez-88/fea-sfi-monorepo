import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export interface Review {
  avatar: string
  name: string
  investedAgo: string
  content: string
}

export interface ReviewTabProps {
  reviews: Review[]
}

export default function ReviewTab({ reviews }: ReviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {reviews.map((review, idx) => (
        <div key={idx} className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <Avatar className="size-10">
              <AvatarImage src={review.avatar} />
              <AvatarFallback>{review.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold">{review.name}</p>
              <p className="text-xs text-muted-foreground">{review.investedAgo}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
          {idx < reviews.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}
