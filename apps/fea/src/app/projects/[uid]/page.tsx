import ProjectHeader from '@/components/ProjectDetail/ProjectHeader'
import ProjectImageCarousel from '@/components/ProjectDetail/ProjectImageCarousel'
import ProjectTabs from '@/components/ProjectDetail/ProjectTabs'
import type { SocialIconType } from '@/components/ProjectDetail/SocialIcon'
import StudioInfoBar from '@/components/ProjectDetail/StudioInfoBar'
import SupportSidebar from '@/components/ProjectDetail/SupportSidebar'
import DiscussionTab from '@/components/ProjectDetail/tabs/DiscussionTab'
import OverviewTab from '@/components/ProjectDetail/tabs/OverviewTab'
import ReviewTab from '@/components/ProjectDetail/tabs/ReviewTab'
import UpdatesTab from '@/components/ProjectDetail/tabs/UpdatesTab'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'

/* ─── Data ─── */

const project = {
  category: { emoji: '🎬', label: 'Film' },
  title: "Unmasked: One women's search for happiness",
  tagline:
    "Support Unmasked: One Woman's Search for Happiness. Help fund a powerful film about identity, courage, and hope.",
  images: ['/assets/studio.jpg', '/assets/studio2.jpg'],
  studio: { name: 'Inka Studio', location: 'UK', logo: '/assets/studio.jpg' },
  supporters: 241,
  closingDate: '14 March, 2025',
  goal: 50_000,
  minimumSupport: 30_000,
  raised: 90_000,
  target: 150_000,
  progress: 60,
}

const perkTiers = [
  {
    price: '$300+',
    perks: ['Early access to update', 'Special supporter only content'],
  },
  {
    price: '$900+',
    perks: ['Early access to update', 'Special supporter only content', 'Gift signed by director'],
  },
  {
    price: '$1200+',
    perks: [
      'Early access to update',
      'Special supporter only content',
      'Gift signed by director',
      'Join our exclusive live event or workshop.',
    ],
  },
]

const updates = [
  {
    date: 'March 15',
    year: '2025',
    title: 'First Teaser',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
    link: 'https://www.youtube.com/watch?v=bV0yAcIG2Ao',
  },
  {
    date: 'March 19',
    year: '2025',
    title: 'Trailor Released',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    link: 'https://www.youtube.com/watch?v=bV0yAcIG2Ao',
  },
  {
    date: 'March 28',
    year: '2025',
    title: 'Supporter Giveaway Announcement',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    date: 'March 28',
    year: '2025',
    title: 'Supporter Giveaway Announcement',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    date: 'April 02',
    year: '2025',
    title: 'Support Our Project: Perks Updated',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
  },
  {
    date: 'April 01',
    year: '2025',
    title: 'Launched 🚀',
    content: '',
  },
]

const discussions = [
  {
    avatar: '/assets/studio.jpg',
    name: 'Rafi Hasan',
    time: '11 days ago',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    replies: [
      {
        avatar: '/assets/studio2.jpg',
        name: 'MR. Pink',
        mention: '@Rafi_hassan',
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
        time: 'Replied 10 days ago',
      },
    ],
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Rafi Hasan',
    time: '9 days ago',
    content:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    replies: [
      {
        avatar: '/assets/studio2.jpg',
        name: 'MR. Pink',
        mention: '@Rafi_hassan',
        content:
          'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        time: 'Replied 9 days ago',
      },
    ],
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Rafi Hasan',
    time: '9 days ago',
    content:
      'Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    replies: [],
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Rafi Hasan',
    time: '9 days ago',
    content: 'Exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    replies: [],
  },
]

const reviews = [
  {
    avatar: '/assets/studio.jpg',
    name: 'Brooklyn Simmons',
    investedAgo: 'Invested 4 days ago',
    content:
      'Aolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.',
  },
  {
    avatar: '/assets/studio2.jpg',
    name: 'Arlene McCoy',
    investedAgo: 'Invested 6 days ago',
    content:
      'Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
  },
  {
    avatar: '/assets/studio.jpg',
    name: 'Guy Hawkins',
    investedAgo: 'Invested 14 days ago',
    content: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et.',
  },
  {
    avatar: '/assets/studio2.jpg',
    name: 'Kristin Watson',
    investedAgo: 'Invested 9 days ago',
    content:
      'Faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu.',
  },
]

const timelineItems = [
  { range: 'Feb 1,2026 – Mar 1,2026', label: 'Final casting + rehearsals, finalize schedule' },
  { range: 'Apr 1,2026 – Apr 30,2026', label: 'Production (18 shooting days)' },
  { range: 'May 1,2026 – Aug 30,2026', label: 'Edit + score + sound design' },
  { range: 'Sep 1,2026 – Nov 30,2026', label: 'Festival submissions + distribution outreach' },
  { range: 'Dec 1,2026 – Jan 30,2027', label: 'Target release window (festival/partner dependent)' },
]

const teamMembers: {
  image: string
  name: string
  role: string
  bio: string
  socials: { type: SocialIconType; href: string }[]
}[] = [
  {
    image: '/assets/studio.jpg',
    name: 'Lena Park',
    role: 'Director, Writer',
    bio: 'Award-winning filmmaker (3 festival selections)',
    socials: [
      { type: 'instagram', href: '#' },
      { type: 'linkedin', href: '#' },
      { type: 'x', href: '#' },
    ],
  },
  {
    image: '/assets/studio2.jpg',
    name: 'Marco Diaz',
    role: 'Producer',
    bio: '2 indie features delivered to streaming partners',
    socials: [
      { type: 'facebook', href: '#' },
      { type: 'x', href: '#' },
    ],
  },
  {
    image: '/assets/studio.jpg',
    name: 'Asha Rahman',
    role: 'Director of Photography',
    bio: 'Specializes in low light, atmospheric photography',
    socials: [
      { type: 'instagram', href: '#' },
      { type: 'facebook', href: '#' },
      { type: 'x', href: '#' },
    ],
  },
]

const faqItems = [
  {
    question: 'How will you approach distribution?',
    answer:
      "We're pursuing a dual path: festival premiere strategy + targeted distribution outreach. The plan will adapt based on early cut reception and partner interest.",
  },
  {
    question: 'What happens if the timeline changes?',
    answer:
      'We will communicate updates through the project page. Dates are targets and may shift due to talent availability, permitting, and delivery requirements.',
  },
  {
    question: 'What are the sources of revenue?',
    answer:
      'Revenue sources include theatrical distribution, streaming licensing, international sales, and ancillary markets such as VOD and physical media.',
  },
]

const risks = [
  'The project may not generate meaningful revenue.',
  'Distribution terms, audience demand, and release timing may vary.',
  'Delays, budget changes, or vendor/talent issues can occur.',
  'Offering terms govern participation; changes may be required for compliance.',
  'There may be no secondary market or ability to exit early.',
]

export default function ProjectDetailPage() {
  return (
    <div>
      <Container orientation="vertical">
        <ProjectHeader
          category={project.category}
          title={project.title}
          tagline={project.tagline}
        />

        <section className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <ProjectImageCarousel images={project.images} title={project.title} />
            <StudioInfoBar
              studio={project.studio}
              supporters={project.supporters}
              closingDate={project.closingDate}
            />
            <ProjectTabs
              overviewContent={
                <OverviewTab
                  timelineItems={timelineItems}
                  teamMembers={teamMembers}
                  faqItems={faqItems}
                  risks={risks}
                />
              }
              updatesContent={<UpdatesTab updates={updates} />}
              discussionContent={<DiscussionTab discussions={discussions} />}
              reviewContent={<ReviewTab reviews={reviews} />}
            />
          </div>

          <SupportSidebar
            goal={project.goal}
            minimumSupport={project.minimumSupport}
            supporters={project.supporters}
            progress={project.progress}
            raised={project.raised}
            target={project.target}
            perkTiers={perkTiers}
          />
        </section>
      </Container>
      <Banners />
    </div>
  )
}
