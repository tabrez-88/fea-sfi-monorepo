import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type BackLinkProps = Readonly<{
  href: string;
  label: string;
  className?: string;
}>;

/**
 * Small "‹‹ back" link used above page titles on detail / create / edit
 * screens. Matches the Figma Deal Create header: small 14px neutral text with
 * a left-arrow glyph.
 */
export function BackLink({ href, label, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-fit items-center gap-1 text-[14px] leading-[20px] text-neutral transition-colors hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}
