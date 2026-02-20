import { Mail, MapPin, Phone } from 'lucide-react'

const iconMap = {
  mail: <Mail className="size-5" />,
  phone: <Phone className="size-5" />,
  'map-pin': <MapPin className="size-5" />,
}

export interface ContactInfoItem {
  icon: keyof typeof iconMap
  title: string
  value: string
}

export interface ContactInfoCardsProps {
  items: ContactInfoItem[]
}

export default function ContactInfoCards({ items }: ContactInfoCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((info) => (
        <div
          key={info.title}
          className="border border-border rounded-xl p-5 flex items-center gap-4"
        >
          <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            {iconMap[info.icon]}
          </div>
          <div>
            <p className="font-bold text-sm">{info.title}</p>
            <p className="text-sm text-muted-foreground">{info.value}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
