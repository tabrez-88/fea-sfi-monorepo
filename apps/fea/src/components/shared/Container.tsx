import React from 'react'

export default function Container({ children, className, orientation = "horizontal", py="lg", gap="lg" }: { children: React.ReactNode, className?: string, orientation?: 'horizontal' | 'vertical', py?: 'lg' | 'md' | 'sm', gap?: 'lg' | 'md' | 'sm' }) {
  return (
    <section className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} md:py-10 md:px-16 ${py === 'lg' ? 'lg:py-20' : py === 'md' ? 'lg:py-12' : 'lg:py-8'} ${gap === 'lg' ? 'gap-4 md:gap-8 lg:gap-12' : gap === 'md' ? 'gap-3 md:gap-6 lg:gap-8' : 'gap-2 md:gap-4 lg:gap-6'} lg:px-37.5 px-4 py-8 ${className || ''}`}>
      {children}
    </section>
  )
}
