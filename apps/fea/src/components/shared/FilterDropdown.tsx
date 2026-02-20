"use client"

import { ChevronDown } from 'lucide-react'

export interface FilterDropdownProps {
  label: string
  value: string
  options: string[]
  onSelect: (val: string) => void
  isOpen: boolean
  onToggle: () => void
  triggerClassName?: string
}

export default function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  isOpen,
  onToggle,
  triggerClassName = 'border-border font-medium',
}: FilterDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm hover:bg-muted transition-colors min-w-32.5 justify-between ${triggerClassName}`}
      >
        <span>{value === 'All' ? label : value}</span>
        <ChevronDown className="size-4" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-10">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                value === option ? 'font-bold' : ''
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
