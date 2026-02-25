"use client"

import { Search } from 'lucide-react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search' }: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <Search strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-md pl-10 pr-4 py-3 text-sm bg-transparent outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
