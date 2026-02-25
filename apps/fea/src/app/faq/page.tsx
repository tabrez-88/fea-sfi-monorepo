import { Suspense } from 'react'

import FaqContent, { type FaqCategoryData } from '@/components/Faq/FaqContent'
import StillNeedHelp from '@/components/Faq/StillNeedHelp'
import Banners from '@/components/shared/Banners'
import Container from '@/components/shared/Container'
import { Separator } from '@/components/ui/separator'

const categories: FaqCategoryData[] = [
  {
    icon: 'flag',
    slug: 'about-fea',
    label: 'About FEA',
    faqs: [
      {
        question: 'What is FEA?',
        answer:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.',
      },
      {
        question: 'Is FEA equity crowdfunding?',
        answer:
          'No, FEA is not equity crowdfunding. FEA offers revenue participation in entertainment projects, not equity ownership in companies.',
      },
      {
        question: 'Is FEA a crypto or token platform?',
        answer:
          'No, FEA is not a crypto or token platform. SFI uses blockchain technology for settlement proof, but FEA does not issue tokens or cryptocurrencies.',
      },
      {
        question: 'Who can invest?',
        answer:
          'Participation on FEA is available to verified users who meet eligibility requirements. Availability varies by region and applicable regulations.',
      },
      {
        question: 'How does FEA differ from crowdfunding?',
        answer:
          'Unlike traditional crowdfunding, FEA offers structured revenue participation with transparent settlement powered by SFI, rather than donation-based or reward-based models.',
      },
    ],
  },
  {
    icon: 'settings',
    slug: 'for-investor',
    label: 'For Investor',
    faqs: [
      {
        question: 'How do I start participating?',
        answer:
          'Create an account, complete verification, and browse available projects on the Discover page.',
      },
      {
        question: 'What are the minimum participation amounts?',
        answer:
          'Minimum participation amounts vary by project and are displayed on each project listing.',
      },
      {
        question: 'How are returns calculated?',
        answer:
          'Returns are calculated based on project revenue performance and your participation share, processed through the SFI settlement engine.',
      },
    ],
  },
  {
    icon: 'heart-handshake',
    slug: 'for-supporter',
    label: 'For Supporter',
    faqs: [
      {
        question: 'What are Perks?',
        answer:
          'Perks are non-financial benefits offered by creators to supporters, such as early access, exclusive content, or merchandise.',
      },
      {
        question: 'Can I support multiple projects?',
        answer:
          'Yes, you can support as many projects as you like through Perks or Verified Participation.',
      },
    ],
  },
  {
    icon: 'user-check',
    slug: 'for-creator',
    label: 'For Creator',
    faqs: [
      {
        question: 'How do I submit a project?',
        answer:
          'Visit the Submit a Project page, complete the application form, and our team will review your submission.',
      },
      {
        question: 'What types of projects are accepted?',
        answer:
          'FEA accepts entertainment projects across films, music, games, live events, and creator projects.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div>
      <Container orientation="vertical" py="md" gap="sm">
        <div className="flex flex-col gap-4 max-w-212.25">
          <p className="text-[20px] text-muted-foreground font-bold uppercase">Support</p>
          <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight">
            Learn how <span className="font-bold">FEA</span> works, how support differs from
            investment, and what to expect
          </h1>
        </div>
      </Container>
      <Separator />
      <Suspense>
        <FaqContent categories={categories} />
      </Suspense>
      <StillNeedHelp />
      <Banners />
    </div>
  )
}
