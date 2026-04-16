import Image from 'next/image';
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
 * FEA-SFI Admin wordmark. Uses /images/logo/logo.png as the icon.
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
      <Image
        src="/images/logo/logo.png"
        alt="FEA-SFI Admin"
        width={spec.icon}
        height={spec.icon}
        className="shrink-0"
        priority
      />
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn('font-medium text-foreground whitespace-nowrap', spec.text)}>
            FEA-SFI Admin
          </span>
          {subtitle && (
            <p className="text-[16px] leading-[20px] tracking-[0.032px] text-neutral">{subtitle}</p>
          )}
        </div>
      )}
    </Link>
  );

  if (!subtitle) return wordmark;

  return <div className={cn('flex flex-col', className)}>{wordmark}</div>;
}

