"use client"

import { CircleMinus, CirclePlus, Flag, HeartHandshake, Settings, UserCheck } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import SearchBar from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/button'

import Container from '../shared/Container'

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
    <Container orientation="vertical" py="sm" gap="sm">
      <div className="flex items-center gap-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Ask a question" />
        <Button size="lg">Search</Button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category, idx) => (
            <button
              key={category.label}
              onClick={() => handleTabChange(idx)}
              className={`flex flex-col items-start gap-6 border rounded-md justify-between p-4 transition-colors ${activeCategory === idx
                ? 'border-foreground font-bold'
                : 'border-border hover:bg-muted'
                }`}
            >
              <div className="flex bg-muted size-10.5 justify-center items-center aspect-square rounded-md">
                {iconMap[category.icon]}
              </div>
              <span className="text-[20px] font-bold">{category.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {currentFaqs.map((faq, idx) => (
            <div key={faq.question} className="border border-border p-6 flex flex-col rounded-md gap-2">
              <button
                onClick={() => setOpenQuestion(openQuestion === idx ? -1 : idx)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-bold text-[20px]">{faq.question}</span>
                <span className={`transition-transform duration-300 ${openQuestion === idx ? 'rotate-180' : 'rotate-0'}`}>
                  {openQuestion === idx ? (
                    <CircleMinus className="size-5 shrink-0" />
                  ) : (
                    <CirclePlus className="size-5 shrink-0" />
                  )}
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openQuestion === idx ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="text-sm text-muted-foreground/80">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}

          {currentFaqs.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No questions found matching your search.
            </p>
          )}
        </div>
      </div>
    </Container>
  )
}
