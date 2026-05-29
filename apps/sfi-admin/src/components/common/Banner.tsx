import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type BannerTone = 'info' | 'warning' | 'success' | 'danger';

type BannerProps = Readonly<{
  tone?: BannerTone;
  children: ReactNode;
  /** Override the default icon for the chosen tone. Pass `null` to hide it. */
  icon?: LucideIcon | null;
  className?: string;
}>;

/**
 * Per-tone surface + text colors. The warning tone overrides the global
 * `--warning` token (which is a saturated `#FFB300` amber used by status
 * badges) with a cooler golden-yellow that reads more clearly as "yellow"
 * against the pale-yellow surface, matching the Figma banner.
 */
const TONE_CLASSES: Record<BannerTone, string> = {
  info: 'bg-info/10 text-info',
  warning: 'bg-[#FEFCE8] text-[#A16207]',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

const DEFAULT_ICONS: Record<BannerTone, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  danger: XCircle,
};

/**
 * Inline info / warning / success / danger banner. Borderless tinted
 * background with the leading status icon and message body both rendered
 * in the tone color (no foreground/black text). Matches the Figma
 * "Rule Snapshots immutable" warning frame `1299:9474` and is reused
 * for every inline advisory across the portal (e.g. the participant-form
 * "leave at default" hint, revenue batch status notes, settlement preview
 * hints, document audit warnings).
 *
 * Pass `icon={null}` to suppress the leading icon, or pass a custom
 * `LucideIcon` to override the tone default.
 */
export function Banner({
  tone = 'info',
  children,
  icon,
  className,
}: BannerProps) {
  const Icon = icon === undefined ? DEFAULT_ICONS[tone] : icon;

  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-[8px] px-4 py-3',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={2}
        />
      )}
      <div className="text-[14px] leading-[20px]">{children}</div>
    </div>
  );
}
