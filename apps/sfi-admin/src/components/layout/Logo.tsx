import Link from 'next/link';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type LogoProps = Readonly<{
  className?: string;
  href?: string;
  /** Controls the icon + text size pair. Defaults match Figma's navbar/auth sizes. */
  size?: 'sm' | 'md' | 'lg';
  /** Show only the icon, omit the "FEA-SFI Admin" wordmark. */
  iconOnly?: boolean;
  /** Optional tagline rendered below the wordmark, left-aligned with the text. */
  subtitle?: string;
}>;

const SIZE_SPECS = {
  sm: { icon: 32, text: 'text-[20px] leading-[24px]' },
  md: { icon: 48, text: 'text-[28px] leading-[32px] tracking-[-0.056px]' },
  lg: { icon: 48, text: 'text-[28px] leading-[32px] tracking-[-0.056px]' },
} as const;

/**
 * FEA-SFI Admin wordmark. The icon is a solid square with a lightning-bolt cutout
 * — matches the Figma `Logo/Dark` symbol (node 88:1323).
 *
 * When `subtitle` is provided the component renders a column: icon+wordmark row
 * on top, subtitle text below, indented to align with the wordmark text.
 */
export function Logo({
  className,
  href = ROUTES.DASHBOARD,
  size = 'md',
  iconOnly = false,
  subtitle,
}: LogoProps) {
  const spec = SIZE_SPECS[size];

  const wordmark = (
    <Link href={href} className={cn('inline-flex items-center gap-[11px]', !subtitle && className)}>
      <svg
        width={spec.icon}
        height={spec.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0 text-foreground"
      >
        <rect width="48" height="48" rx="8" fill="currentColor" />
        <path d="M25.5 12 L17 27 H23 L20.5 36 L31 20.5 H25 Z" className="fill-background" />
      </svg>
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn('font-medium text-foreground whitespace-nowrap', spec.text)}>
            FEA-SFI Admin
          </span>
          <p className="text-[16px] leading-[20px] tracking-[0.032px] text-neutral">{subtitle}</p>
        </div>
      )}
    </Link>
  );

  if (!subtitle) return wordmark;

  return <div className={cn('flex flex-col ', className)}>{wordmark}</div>;
}
