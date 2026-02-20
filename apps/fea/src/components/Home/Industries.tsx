import { Clapperboard, Gamepad2, Music } from 'lucide-react'
import Link from 'next/link'

interface IndustryCard {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

const industries: IndustryCard[] = [
  {
    icon: <Clapperboard className="size-8" />,
    title: 'Films & TV',
    description: 'Box office, streaming deals, licensing',
    href: '/projects?category=films-tv',
  },
  {
    icon: <Music className="size-8" />,
    title: 'Music',
    description: 'Royalties, streaming revenue',
    href: '/projects?category=music',
  },
  {
    icon: <Gamepad2 className="size-8" />,
    title: 'Games',
    description: 'Sales, in-game revenue, DLC',
    href: '/projects?category=games',
  },
  {
    icon: <span className="text-3xl">🎤</span>,
    title: 'Live Events',
    description: 'Tickets, sponsorships, merch',
    href: '/projects?category=live-events',
  },
  {
    icon: <span className="text-3xl">🌟</span>,
    title: 'Creator Projects',
    description: 'Channels, brands, and digital creators',
    href: '/projects?category=creator-projects',
  },
]

export default function Industries() {
  return (
    <section>
      <div className="flex flex-col gap-4">
        <p className="text-[20px] text-muted-foreground font-bold uppercase">
          Inside the Future of Environment
        </p>
        <h4 className="text-[40px] font-extralight leading-tight max-w-212">
          Opportunities from across the{' '}
          <span className="font-bold">Entertainment</span> industry
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
        {industries.map((industry) => (
          <div
            key={industry.title}
            className="rounded-xl border p-4 flex flex-col gap-6 w-52 xl:w-full"
          >
            <div className="size-14 rounded-xl shadow-xl/15 flex items-center justify-center">
              {industry.icon}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-xl ">{industry.title}</h3>
              <p className="text-sm text-muted-foreground">
                {industry.description}
              </p>
            </div>
            <Link
              href={industry.href as never}
              className="text-sm font-bold underline mt-auto"
            >
              Explore {industry.title}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
