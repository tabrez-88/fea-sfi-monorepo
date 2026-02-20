'use client'

import { useState } from 'react'

import FilterDropdown from '@/components/shared/FilterDropdown'
import Pagination from '@/components/shared/Pagination'
import SearchBar from '@/components/shared/SearchBar'

import BlogPostCard, { type BlogPost } from './BlogPostCard'

const ITEMS_PER_PAGE = 9

interface BlogGridProps {
  posts: BlogPost[]
  categories: string[]
  sortOptions: string[]
}

export default function BlogGrid({ posts, categories, sortOptions }: BlogGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSort, setSelectedSort] = useState('Newest')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || post.badge === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE))

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <>
      {/* Search & Filters */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchBar
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value)
            setCurrentPage(1)
          }}
          placeholder="Search"
        />
        <FilterDropdown
          label="All"
          value={selectedCategory}
          options={categories}
          onSelect={(val) => {
            setSelectedCategory(val)
            setCurrentPage(1)
          }}
          isOpen={openDropdown === 'All'}
          onToggle={() => setOpenDropdown(openDropdown === 'All' ? null : 'All')}
        />
        <FilterDropdown
          label="Sort By"
          value={selectedSort}
          options={sortOptions}
          onSelect={(val) => {
            setSelectedSort(val)
          }}
          isOpen={openDropdown === 'Sort By'}
          onToggle={() => setOpenDropdown(openDropdown === 'Sort By' ? null : 'Sort By')}
        />
      </section>

      {/* Blog Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedPosts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </section>

      {paginatedPosts.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No posts found matching your criteria.
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  )
}
