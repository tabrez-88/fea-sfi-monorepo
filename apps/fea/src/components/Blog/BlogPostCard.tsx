import { Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export interface BlogPost {
  id: number
  image: string
  badge: string
  title: string
  date: string
  excerpt: string
}

interface BlogPostCardProps {
  post: BlogPost
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${post.id}` as never}
      className="group border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full">
          {post.badge}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <h3 className="font-bold text-sm leading-snug line-clamp-2">{post.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>{post.date}</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>

        <span className="text-sm font-bold">Read More</span>
      </div>
    </Link>
  )
}
