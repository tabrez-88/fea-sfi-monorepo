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
    <section className="bg-primary text-background rounded-md p-6 lg:mx-37.5 mb-8 lg:mb-20 flex flex-col md:flex-row justify-between items-start gap-6">
      <div className="flex flex-col gap-4 md:w-100">
        <p className="text-[20px] font-bold uppercase tracking-wide">
          Fuel Your Creative Projects
        </p>
        <h4 className="text-[40px] tracking-tight font-extralight leading-tight">
          Power your <span className="font-bold">creative</span> projects with
          community support
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-6 md:w-2/3">
        {features.map((feature) => (
          <div
            key={feature.label}
            className="bg-[#2C2C2C] rounded-md p-4 h-38 flex flex-col gap-6"
          >
            <div className="size-10 rounded-md bg-white/10 flex items-center justify-center">
              {feature.icon}
            </div>
            <p className="font-bold text-[20px]">{feature.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
