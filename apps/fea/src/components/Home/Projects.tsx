import type { Route } from 'next'
import Link from 'next/link'
import React from 'react'

import ProjectCardItem from '@/components/shared/ProjectCardItem'
import type { ProjectCardData } from '@/components/shared/ProjectCardItem'

type ProjectType = {
  title: React.ReactNode
  subtitle: string
  projects: ProjectCardData[]
}

export type { ProjectCardData }

export default function Projects({ title, subtitle, projects }: ProjectType) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex flex-col gap-4">
          <p className="text-[20px] text-muted-foreground font-bold uppercase">{subtitle}</p>
          <h4 className="text-[40px] font-extralight leading-tight">{title}</h4>
        </div>
        <Link href={"/projects" as Route} className="font-bold underline">
          See More
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {projects.map((project) => (
          <ProjectCardItem key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}
