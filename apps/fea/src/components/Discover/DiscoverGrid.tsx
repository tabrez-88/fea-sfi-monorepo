'use client'

import { useState } from 'react'

import FilterDropdown from '@/components/shared/FilterDropdown'
import Pagination from '@/components/shared/Pagination'
import ProjectCardItem from '@/components/shared/ProjectCardItem'
import type { ProjectCardData } from '@/components/shared/ProjectCardItem'
import SearchBar from '@/components/shared/SearchBar'

const ITEMS_PER_PAGE = 9

interface DiscoverGridProps {
  projects: ProjectCardData[]
  categories: string[]
  statuses: string[]
  sortOptions: string[]
}

export default function DiscoverGrid({
  projects,
  categories,
  statuses,
  sortOptions,
}: DiscoverGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedSort, setSelectedSort] = useState('Newest')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category.label === selectedCategory
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE))

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className='flex flex-col pt-6 pb-12 lg:px-37.5'>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value)
            setCurrentPage(1)
          }}
          placeholder="Search"
        />
        <FilterDropdown
          label="Category"
          value={selectedCategory}
          options={categories}
          onSelect={(val) => {
            setSelectedCategory(val)
            setCurrentPage(1)
          }}
          isOpen={openDropdown === 'Category'}
          onToggle={() => setOpenDropdown(openDropdown === 'Category' ? null : 'Category')}
          triggerClassName="border-primary font-bold"
        />
        <FilterDropdown
          label="Status"
          value={selectedStatus}
          options={statuses}
          onSelect={(val) => {
            setSelectedStatus(val)
            setCurrentPage(1)
          }}
          isOpen={openDropdown === 'Status'}
          onToggle={() => setOpenDropdown(openDropdown === 'Status' ? null : 'Status')}
          triggerClassName="border-primary font-bold"
        />
        <FilterDropdown
          label="Sort By"
          value={selectedSort}
          options={sortOptions}
          onSelect={setSelectedSort}
          isOpen={openDropdown === 'Sort By'}
          onToggle={() => setOpenDropdown(openDropdown === 'Sort By' ? null : 'Sort By')}
          triggerClassName="border-primary font-bold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {paginatedProjects.map((project) => (
          <ProjectCardItem key={project.id} project={project} />
        ))}
      </div>

      {paginatedProjects.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No projects found matching your criteria.
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
