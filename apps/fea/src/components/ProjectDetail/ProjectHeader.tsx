export interface ProjectHeaderProps {
  category: { emoji: string; label: string }
  title: string
  tagline: string
}

export default function ProjectHeader({ category, title, tagline }: ProjectHeaderProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-bold">
        <span>{category.emoji}</span>
        <span>{category.label}</span>
      </div>
      <h1 className="text-3xl lg:text-[40px] font-extralight leading-tight max-w-3xl">{title}</h1>
      <p className="text-sm font-bold text-muted-foreground max-w-3xl">{tagline}</p>
    </section>
  )
}
