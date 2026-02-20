'use client'

import { useState } from 'react'

const tabs = ['Overview', 'Updates', 'Discussion', 'Review'] as const
type Tab = (typeof tabs)[number]

export interface ProjectTabsProps {
  overviewContent: React.ReactNode
  updatesContent: React.ReactNode
  discussionContent: React.ReactNode
  reviewContent: React.ReactNode
}

export default function ProjectTabs({
  overviewContent,
  updatesContent,
  discussionContent,
  reviewContent,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  return (
    <>
      {/* Tab Bar */}
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm transition-colors ${
              activeTab === tab
                ? 'font-bold border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && overviewContent}
      {activeTab === 'Updates' && updatesContent}
      {activeTab === 'Discussion' && discussionContent}
      {activeTab === 'Review' && reviewContent}
    </>
  )
}
