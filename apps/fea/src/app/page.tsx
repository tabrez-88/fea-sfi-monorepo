import CTA from "@/components/Home/CTA";
import Industries from "@/components/Home/Industries";
import Jumbotron from "@/components/Home/Jumbotron";
import Projects, { ProjectCardData } from "@/components/Home/Projects";
import Testimonials from "@/components/Home/Testimonials";
import WhyChooseFEA from "@/components/Home/WhyChooseFEA";
import Banners from "@/components/shared/Banners";
import { Separator } from "@/components/ui/separator";

const trendingProjects: ProjectCardData[] = [
  {
    id: 1,
    image: "/assets/studio.jpg",
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
  {
    id: 2,
    image: "/assets/studio2.jpg",
    title: 'Creative Studio',
    badges: ['Trending', 'New'],
    category: { emoji: '🌟', label: 'Creator Projects' },
    location: 'Europe',
    status: '9 Days',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    perksAvailable: true,
    verifiedParticipant: false,
    progress: 60,
    entryFrom: 400,
  },
  {
    id: 3,
    image: "/assets/studio.jpg",
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
]

export default function HomePage() {

  return (
    <div>
      <Jumbotron />
      <Separator />
      <WhyChooseFEA />
      <Separator />
      <Projects
        title={
          <>Discover the <span className="font-bold">Featured</span> Entertainment Projects</>
        }
        subtitle="Featured Deals"
        projects={trendingProjects}
      />
      <Separator />
      <Industries />
      <Separator />
      <Projects
        title={
          <>Discover the <span className="font-bold">Latest</span> Entertainment Projects</>
        }
        subtitle="New Opportunities"
        projects={trendingProjects}
      />
      <Separator />
      <CTA />
      <Separator />
      <Testimonials />
      <Banners />
    </div>
  );
}
