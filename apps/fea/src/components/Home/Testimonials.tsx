import { Star } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import Container from '../shared/Container'

interface Testimonial {
  avatar: string
  name: string
  role: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    avatar: '/assets/studio.jpg',
    name: 'Annette Black',
    role: 'Creator, Lotus Film Studio',
    quote:
      '\u201cEFI made reporting simple. We uploaded our revenue data and the system handled the rest. The process was clear and well-structured.\u201d',
    rating: 4,
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Brooklyn Simmons',
    role: 'Investor',
    quote:
      '\u201cFinally, a platform that lets fans participate in real entertainment projects. The transparency and structure make it easy to understand.\u201d',
    rating: 4,
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Leslie Alexander',
    role: 'Investor',
    quote:
      '\u201cFor our music label, FEA opened a new way to engage supporters. Managing participation and long-term reporting felt seamless.\u201d',
    rating: 4,
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Kristin Watson',
    role: 'Creator, MetroSound Records',
    quote:
      '\u201cI\u2019ve used many creative platforms, but FEA is the first one where I clearly understand how projects are structured and managed.\u201d',
    rating: 3,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-5 ${
            i < rating
              ? 'fill-foreground text-foreground'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <Container orientation="vertical">
      <div className="flex flex-col md:flex-row item-start md:items-center justify-between gap-4 w-full">
        <div className="flex flex-col gap-4">
          <p className="text-[20px] text-muted-foreground font-bold uppercase">
            Testimonials
          </p>
          <h4 className="text-[40px] font-extralight leading-tight">
            What <span className="font-bold">Creators & Supporters</span> Are
            Saying
          </h4>
        </div>
        <Link href={"/testimonials" as never} className="font-bold underline">
          See More
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5"
          >
            <Avatar className="size-12">
              <AvatarImage src={t.avatar} alt={t.name} />
              <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <p className="text-base font-bold leading-relaxed flex-1">
              {t.quote}
            </p>

            <StarRating rating={t.rating} />

            <div>
              <p className="font-bold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}
