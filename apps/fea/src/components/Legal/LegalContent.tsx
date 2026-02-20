interface ContentBlock {
  type: 'paragraph' | 'bullets'
  text?: string
  items?: string[]
}

export interface LegalSectionData {
  id: string
  title: string
  blocks: ContentBlock[]
}

interface LegalContentProps {
  sections: LegalSectionData[]
}

export default function LegalContent({ sections }: LegalContentProps) {
  return (
    <div className="flex-1 flex flex-col gap-10">
      {sections.map((section) => (
        <div key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="text-lg font-bold mb-4">{section.title}</h2>
          <div className="flex flex-col gap-4">
            {section.blocks.map((block, index) => {
              if (block.type === 'paragraph') {
                return (
                  <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                    {block.text}
                  </p>
                )
              }

              if (block.type === 'bullets' && block.items) {
                return (
                  <ul key={index} className="flex flex-col gap-1.5 pl-4">
                    {block.items.map((item) => (
                      <li key={item} className="text-sm text-muted-foreground list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              }

              return null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
