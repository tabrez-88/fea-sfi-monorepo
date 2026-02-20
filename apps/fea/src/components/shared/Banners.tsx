import { Globe, LayoutGrid, Scaling, SquareActivity } from 'lucide-react'

interface BannerFeature {
  icon: React.ReactNode
  label: string
}

const features: BannerFeature[] = [
  {
    icon: <Scaling className="size-5" />,
    label: 'Flexible Participation Models',
  },
  {
    icon: <LayoutGrid className="size-5" />,
    label: 'Perks & rewards builder',
  },
  {
    icon: <Globe className="size-5" />,
    label: 'Region-specific compliance',
  },
  {
    icon: <SquareActivity className="size-5" />,
    label: 'EFI settlement & reporting engine',
  },
]

export default function Banners() {
  return (
    <section className="bg-primary text-background rounded-3xl p-10 flex flex-col md:flex-row items-start gap-8">
      <div className="flex flex-col gap-4 md:w-1/3">
        <p className="text-sm font-bold uppercase tracking-wide">
          Fuel Your Creative Projects
        </p>
        <h4 className="text-[32px] font-extralight leading-tight">
          Power your <span className="font-bold">creative</span> projects with
          community support
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:w-2/3">
        {features.map((feature) => (
          <div
            key={feature.label}
            className="bg-white/10 rounded-2xl p-6 flex flex-col gap-4"
          >
            <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
              {feature.icon}
            </div>
            <p className="font-bold">{feature.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
