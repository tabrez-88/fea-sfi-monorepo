'use client'

import { useEffect, useState } from 'react'

interface LegalSidebarProps {
  sections: { id: string; title: string }[]
}

export default function LegalSidebar({ sections }: LegalSidebarProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' },
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 flex flex-col gap-2">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={() => setActiveSection(section.id)}
            className={`text-sm py-1 transition-colors ${
              activeSection === section.id
                ? 'font-bold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {section.title}
          </a>
        ))}
      </div>
    </nav>
  )
}
