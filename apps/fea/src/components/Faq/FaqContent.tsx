"use client"

import { CirclePlus, Flag, HeartHandshake, Settings, UserCheck } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import SearchBar from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategoryData {
  icon: string
  slug: string
  label: string
  faqs: FaqItem[]
}

export interface FaqContentProps {
  categories: FaqCategoryData[]
}

const iconMap: Record<string, React.ReactNode> = {
  flag: <Flag className="size-5" />,
  settings: <Settings className="size-5" />,
  'heart-handshake': <HeartHandshake className="size-5" />,
  'user-check': <UserCheck className="size-5" />,
}

export default function FaqContent({ categories }: FaqContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab')
  const initialIndex = Math.max(0, categories.findIndex((c) => c.slug === tabParam))

  const [activeCategory, setActiveCategory] = useState(initialIndex)
  const [openQuestion, setOpenQuestion] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const tab = searchParams.get('tab')
    const idx = categories.findIndex((c) => c.slug === tab)
    if (idx >= 0 && idx !== activeCategory) {
      setActiveCategory(idx)
      setOpenQuestion(-1)
    }
  }, [searchParams, categories, activeCategory])

  function handleTabChange(idx: number) {
    setActiveCategory(idx)
    setOpenQuestion(-1)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', categories[idx]!.slug)
    router.replace(`${pathname}?${params.toString()}` as never, { scroll: false })
  }

  const currentFaqs = (categories[activeCategory]?.faqs ?? []).filter((faq) =>
    searchQuery
      ? faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  return (
    <>
      {/* Search */}
      <section className="flex items-center gap-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Ask a question" />
        <Button className="rounded-lg">Search</Button>
      </section>

      {/* Category Tabs */}
      <section className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category, idx) => (
            <button
              key={category.label}
              onClick={() => handleTabChange(idx)}
              className={`flex flex-col items-start gap-3 border rounded-xl p-4 transition-colors ${
                activeCategory === idx
                  ? 'border-foreground bg-muted font-bold'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {iconMap[category.icon]}
              <span className="text-sm font-bold">{category.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="flex flex-col">
          {currentFaqs.map((faq, idx) => (
            <div key={faq.question} className="border-b border-border">
              <button
                onClick={() => setOpenQuestion(openQuestion === idx ? -1 : idx)}
                className="flex items-center justify-between w-full py-5 text-left"
              >
                <span className="font-bold text-sm">{faq.question}</span>
                <CirclePlus
                  className={`size-5 shrink-0 ml-4 transition-transform ${
                    openQuestion === idx ? 'rotate-45' : ''
                  }`}
                />
              </button>
              {openQuestion === idx && (
                <p className="text-sm text-muted-foreground pb-5 pr-10">{faq.answer}</p>
              )}
            </div>
          ))}

          {currentFaqs.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No questions found matching your search.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
