import DiscoverGrid from '@/components/Discover/DiscoverGrid'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import type { ProjectCardData } from '@/components/shared/ProjectCardItem'

const allProjects: ProjectCardData[] = [
  {
    id: 1,
    image: '/assets/studio.jpg',
    title: "Unmasked: One women's searc...",
    badges: ['Trending', 'New'],
    category: { emoji: '🎬', label: 'Film' },
    location: 'UK',
    status: '21 Days',
    description:
      'Support Unmasked: One Woman\'s Search for Happiness. Help fund a powerful film about identity, courage, and hope.',
    perksAvailable: true,
    verifiedParticipant: true,
    progress: 60,
    entryFrom: 400,
  },
  {
    id: 2,
    image: '/assets/studio2.jpg',
    title: 'Rose Boy- Avery Davis Album r...',
    badges: ['Trending'],
    category: { emoji: '🎵', label: 'Music' },
    location: 'USA',
    status: 'Closed',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: true,
    progress: 60,
    entryFrom: 800,
  },
  {
    id: 3,
    image: '/assets/studio.jpg',
    title: 'SOUL- Drew Frig Single Release',
    badges: ['New'],
    category: { emoji: '🎵', label: 'Music' },
    location: 'USA',
    status: '18 Days',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: false,
    verifiedParticipant: true,
    progress: 40,
    entryFrom: 800,
  },
  {
    id: 4,
    image: '/assets/studio2.jpg',
    title: 'Borcelle Game Tournament',
    badges: ['New'],
    category: { emoji: '🎤', label: 'Live Events' },
    location: 'USA',
    status: 'Funded',
    statusColor: 'text-green-500',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: false,
    progress: 100,
    entryFrom: 400,
  },
  {
    id: 5,
    image: '/assets/studio.jpg',
    title: 'Mismatched Mates',
    badges: ['Trending'],
    category: { emoji: '🎬', label: 'Film' },
    location: 'Europe',
    status: '22 Days',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: true,
    progress: 60,
    entryFrom: 800,
  },
  {
    id: 6,
    image: '/assets/studio2.jpg',
    title: 'Bassline Studio',
    badges: ['New'],
    category: { emoji: '🌟', label: 'Creator Projects' },
    location: 'Europe',
    status: 'Upcoming',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: false,
    verifiedParticipant: true,
    progress: 0,
    entryFrom: 800,
  },
  {
    id: 7,
    image: '/assets/studio.jpg',
    title: 'Creative Studio',
    badges: ['Trending', 'New'],
    category: { emoji: '🌟', label: 'Creator Projects' },
    location: 'Europe',
    status: 'Closed',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: false,
    progress: 60,
    entryFrom: 400,
  },
  {
    id: 8,
    image: '/assets/studio2.jpg',
    title: 'Elden Ring',
    badges: ['New'],
    category: { emoji: '🎮', label: 'Games' },
    location: 'UK',
    status: 'Upcoming',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: false,
    progress: 0,
    entryFrom: 200,
  },
  {
    id: 9,
    image: '/assets/studio.jpg',
    title: 'Live Music: Hanover & Tyke',
    badges: ['Trending'],
    category: { emoji: '🎤', label: 'Live Events' },
    location: 'USA',
    status: 'Funded',
    statusColor: 'text-green-500',
    description:
      'Join us for an electrifying rock performance by an incredible lineup of talented artist ready to rock the stage!',
    perksAvailable: true,
    verifiedParticipant: true,
    progress: 100,
    entryFrom: 200,
  },
]

const categories = ['All', 'Film', 'Music', 'Games', 'Live Events', 'Creator Projects']
const statuses = ['All', 'Funded', 'Upcoming', 'Closed']
const sortOptions = ['Newest', 'Oldest', 'Most Funded', 'Entry: Low to High', 'Entry: High to Low']

export default function DiscoverPage() {
  return (
    <Container>
      <div className="flex flex-col gap-4">
        <p className="text-[20px] text-muted-foreground font-bold uppercase">
          Discover Opportunities
        </p>
        <h4 className="text-[40px] font-extralight leading-tight">
          <span className="font-bold">Explore</span> films, music, games, live events, and
          creator projects.
        </h4>
      </div>

      <DiscoverGrid
        projects={allProjects}
        categories={categories}
        statuses={statuses}
        sortOptions={sortOptions}
      />

      <Banners />
    </Container>
  )
}
