import BlogGrid from '@/components/Blog/BlogGrid'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'


const allPosts = [
  {
    id: 1,
    image: '/assets/studio.jpg',
    badge: 'Insight',
    title: 'What Is Revenue Participation and How Does It Work?',
    date: '23 Feb, 2024',
    excerpt:
      'A clear breakdown of how revenue participation works on FEA — from deal structure to settlement via SFI.',
  },
  {
    id: 2,
    image: '/assets/studio2.jpg',
    badge: 'Tips',
    title: '5 Things to Know Before You Back a Film Project',
    date: '20 Feb, 2024',
    excerpt:
      'Thinking about supporting a film on FEA? Here are five key considerations before you commit.',
  },
  {
    id: 3,
    image: '/assets/studio.jpg',
    badge: 'Newsletter',
    title: 'FEA Monthly: New Projects, Platform Updates, and More',
    date: '15 Feb, 2024',
    excerpt:
      'Catch up on the latest FEA news — new project listings, feature releases, and community highlights.',
  },
  {
    id: 4,
    image: '/assets/studio2.jpg',
    badge: 'Insight',
    title: 'How SFI Powers Transparent Settlement on FEA',
    date: '10 Feb, 2024',
    excerpt:
      'Learn how the SFI engine processes revenue data and produces verifiable settlement records for every participant.',
  },
  {
    id: 5,
    image: '/assets/studio.jpg',
    badge: 'Tips',
    title: 'How to Evaluate a Music Project on FEA',
    date: '5 Feb, 2024',
    excerpt:
      'A practical guide to assessing music projects — from artist background to revenue potential and deal terms.',
  },
  {
    id: 6,
    image: '/assets/studio2.jpg',
    badge: 'Newsletter',
    title: 'FEA Weekly Digest: Creator Spotlights and Milestones',
    date: '1 Feb, 2024',
    excerpt:
      'This week on FEA — creator interviews, funding milestones, and upcoming project announcements.',
  },
  {
    id: 7,
    image: '/assets/studio.jpg',
    badge: 'Insight',
    title: 'Understanding Risk in Entertainment Participation',
    date: '28 Jan, 2024',
    excerpt:
      'Every opportunity comes with risk. Here is how FEA approaches transparency and what you should know.',
  },
  {
    id: 8,
    image: '/assets/studio2.jpg',
    badge: 'Tips',
    title: 'Getting Started as a Creator on FEA',
    date: '22 Jan, 2024',
    excerpt:
      'A step-by-step guide for creators looking to list their entertainment project on the FEA platform.',
  },
  {
    id: 9,
    image: '/assets/studio.jpg',
    badge: 'Newsletter',
    title: 'Year in Review: FEA 2023 Highlights',
    date: '15 Jan, 2024',
    excerpt:
      'Looking back at an incredible year — key milestones, platform growth, and the projects that made it happen.',
  },
]

const categories = ['All', 'Insight', 'Tips', 'Newsletter']
const sortOptions = ['Newest', 'Oldest']

export default function BlogPage() {
  return (
    <div>
      <Container orientation="vertical">
        {/* Header */}
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-bold uppercase">Blog</p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-2xl">
            Stories from the world of{' '}
            <span className="font-bold">entertainment participation</span>
          </h1>
        </section>

        <BlogGrid posts={allPosts} categories={categories} sortOptions={sortOptions} />
      </Container>
      <Banners />
    </div>
  )
}
