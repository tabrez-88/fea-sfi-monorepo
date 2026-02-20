import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandX } from '@tabler/icons-react'

export type SocialIconType = 'instagram' | 'linkedin' | 'facebook' | 'x'

export interface SocialIconProps {
  type: SocialIconType
}

export default function SocialIcon({ type }: SocialIconProps) {
  if (type === 'instagram') return <IconBrandInstagram className="size-4" />
  if (type === 'linkedin') return <IconBrandLinkedin className="size-4" />
  if (type === 'facebook') return <IconBrandFacebook className="size-4" />
  return <IconBrandX className="size-4" />
}
