import React from 'react'

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:py-10 md:px-16 lg:gap-10 lg:py-20 lg:px-37.5 min-h-screen p-4">
      {children}
    </div>
  )
}
