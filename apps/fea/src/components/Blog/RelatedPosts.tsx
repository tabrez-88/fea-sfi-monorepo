import { Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export interface RelatedPost {
  id: number
  image: string
  badge: string
  title: string
  date: string
  excerpt: string
}

export interface RelatedPostsProps {
  posts: RelatedPost[]
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  return (
    <aside className="lg:w-72 shrink-0">
      <div className="sticky top-24 flex flex-col gap-6">
        <h3 className="font-bold text-lg">You May Also Like</h3>

        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}` as never}
            className="group flex flex-col gap-3 border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 bg-foreground text-background text-xs font-bold px-2.5 py-0.5 rounded-full">
                {post.badge}
              </span>
            </div>

            <div className="px-4 pb-4 flex flex-col gap-2">
              <h4 className="font-bold text-sm leading-snug line-clamp-2">{post.title}</h4>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                <span>{post.date}</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {post.excerpt}{' '}
                <span className="font-bold text-foreground underline">Read More</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
