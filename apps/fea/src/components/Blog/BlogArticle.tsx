import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
} from '@tabler/icons-react'
import { Calendar } from 'lucide-react'
import Image from 'next/image'

export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string }

export interface ShareLink {
  icon: 'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube'
  href: string
  label: string
}

export interface BlogArticleProps {
  heroImage: string
  title: string
  date: string
  shareLinks: ShareLink[]
  content: ContentBlock[]
}

const iconMap = {
  facebook: <IconBrandFacebook className="size-4" />,
  instagram: <IconBrandInstagram className="size-4" />,
  linkedin: <IconBrandLinkedin className="size-4" />,
  x: <IconBrandX className="size-4" />,
  youtube: <IconBrandYoutube className="size-4" />,
} as const

export default function BlogArticle({
  heroImage,
  title,
  date,
  shareLinks,
  content,
}: BlogArticleProps) {
  return (
    <article className="flex-1 flex flex-col gap-6">
      {/* Hero Image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
        <Image
          src={heroImage}
          alt="Blog hero"
          fill
          className="object-cover"
        />
      </div>

      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
        {title}
      </h1>

      {/* Date & Share */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Share:</span>
          {shareLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-label={link.label}
              className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              {iconMap[link.icon]}
            </a>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-6">
        {content.map((block, index) =>
          block.type === 'paragraph' ? (
            <p key={index} className="text-sm text-muted-foreground leading-relaxed">
              {block.text}
            </p>
          ) : (
            <div key={index} className="relative w-full aspect-video rounded-2xl overflow-hidden">
              <Image
                src={block.src}
                alt={block.alt}
                fill
                className="object-cover"
              />
            </div>
          )
        )}
      </div>
    </article>
  )
}
