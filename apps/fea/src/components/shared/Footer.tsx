'use client'

import { IconBrandFacebookFilled, IconBrandInstagram, IconBrandLinkedin, IconBrandX, IconBrandYoutubeFilled } from '@tabler/icons-react'
import { Activity, Globe } from 'lucide-react'
import Link from 'next/link'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'

const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Featured Deals', href: '/featured-deals' },
      { label: 'EFI Engine', href: '/efi-engine' },
      { label: 'FEA Core', href: '/fea-core' },
    ],
  },
  {
    title: 'For Investors',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Investor FAQs', href: '/faq?tab=for-investor' },
      { label: 'Tax Information', href: '/tax-information' },
      { label: 'Account Login', href: '/login' },
    ],
  },
  {
    title: 'For Creators',
    links: [
      { label: 'Submit a Project', href: '/submit-project' },
      { label: 'Creator Studio', href: '/creator-studio' },
      { label: 'Creator FAQ', href: '/faq?tab=for-creator' },
      { label: 'Account Login', href: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About FEA', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog / Updates', href: '/blog' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Risk Disclosure', href: '/risk-disclosure' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Region Compliance', href: '/region-compliance' },
    ],
  },
]

const socialLinks = [
  { icon: <IconBrandFacebookFilled className="size-4" />, href: '#', label: 'Facebook' },
  { icon: <IconBrandInstagram className="size-4" />, href: '#', label: 'Instagram' },
  { icon: <IconBrandLinkedin className="size-4" />, href: '#', label: 'LinkedIn' },
  { icon: <IconBrandX className="size-4" />, href: '#', label: 'X' },
  { icon: <IconBrandYoutubeFilled className="size-4" />, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="flex flex-col md:py-8 md:px-16 gap-4 lg:gap-6 lg:pt-12 lg:pb-6 lg:px-37.5 p-4 border-t border-border">
      <div className="flex flex-col gap-20">

        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="size-6" />
              <div className="flex flex-col gap-1">
                <p className="font-bold text-lg leading-none">FEA</p>
                <p className="text-sm text-muted-foreground">Invest in Entertainment</p>
              </div>
            </div>
            <Separator orientation="vertical" className="hidden md:block data-[orientation=vertical]:h-13" />
            <div className="text-sm text-muted-foreground">
              <p>Real revenue. Real transparency.</p>
              <p>
                Powered by <span className="font-bold text-foreground">EFI Settlement Engine</span>
              </p>
            </div>
          </div>

          <Select defaultValue="en">
            <SelectTrigger size='lg'>
              <Globe className="size-4" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Indonesia</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="font-bold text-lg">{group.title}</h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as never}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      <Separator />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; 2025 FEA Entertainment Finance.
        </p>
        <div className="flex items-center gap-3">
          {socialLinks.map((social) => (
            <Link
              key={social.label}
              href={social.href as never}
              aria-label={social.label}
              className="size-6 rounded-sm border border-black flex items-center justify-center hover:bg-muted transition-colors"
            >
              {social.icon}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
