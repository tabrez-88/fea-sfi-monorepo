import { Heart, MessageSquare } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export interface Reply {
  avatar: string
  name: string
  mention: string
  content: string
  time: string
}

export interface Discussion {
  avatar: string
  name: string
  time: string
  content: string
  replies: Reply[]
}

export interface DiscussionTabProps {
  discussions: Discussion[]
}

export default function DiscussionTab({ discussions }: DiscussionTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {discussions.map((discussion, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          {/* Main Comment */}
          <div className="flex gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={discussion.avatar} />
              <AvatarFallback>{discussion.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-sm font-bold">{discussion.name}</p>
              <p className="text-xs text-muted-foreground">{discussion.time}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{discussion.content}</p>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Heart className="size-3.5" />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <MessageSquare className="size-3.5" />
              <span>Reply</span>
            </button>
          </div>

          {/* Replies */}
          {discussion.replies.map((reply, rIdx) => (
            <div key={rIdx} className="ml-10 flex flex-col gap-2 border-l-2 border-border pl-4">
              <div className="flex gap-3 items-start">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={reply.avatar} />
                  <AvatarFallback>{reply.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{reply.name}</span>{' '}
                    <span className="text-muted-foreground">{reply.mention}</span>{' '}
                    <span className="text-muted-foreground">{reply.content}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">{reply.time}</span>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Heart className="size-3" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <MessageSquare className="size-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {idx < discussions.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}
