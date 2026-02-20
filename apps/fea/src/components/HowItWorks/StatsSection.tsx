import React from 'react'

export interface StatsSectionProps {
  missionText: React.ReactNode
  stats: { value: string; label: string }[]
}

export default function StatsSection({ missionText, stats }: StatsSectionProps) {
  return (
    <>
      <section className="max-w-3xl">
        <p className="text-xl lg:text-2xl font-extralight leading-relaxed">
          {missionText}
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border rounded-xl p-6 flex flex-col gap-1"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>
    </>
  )
}
