import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

type AuthSplitLayoutProps = Readonly<{
  children: ReactNode;
  /** Subtitle shown under the "FEA-SFI Admin" wordmark. */
  subtitle?: string;
  /** Background photo. Falls back to a generic work photo if omitted. */
  imageSrc?: string;
  imageAlt?: string;
  /** Which side the photo renders on. Figma: login = left, register/forgot = right. */
  imageSide?: 'left' | 'right';
  /** Override the bottom terms-of-use copy. */
  footer?: ReactNode;
}>;

const DEFAULT_IMAGE = '/images/auth/login.png';

/**
 * Split auth layout with a floating photo card on one side and a centered form
 * on the other. Matches Figma tokens: image 832×977 at 20px radius, form
 * container width 340px, 24px gap between header + form, 81px gap between
 * form and footer copy.
 */
export function AuthSplitLayout({
  children,
  subtitle = 'Create your own deals here',
  imageSrc = DEFAULT_IMAGE,
  imageAlt = 'Team collaborating',
  imageSide = 'left',
  footer,
}: AuthSplitLayoutProps) {
  const imageOrderClass = imageSide === 'left' ? 'lg:order-first' : 'lg:order-last';

  return (
    <div className="relative min-h-screen bg-white">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        {/* ─── Photo panel ────────────────────────────────────────────── */}
        <div
          className={cn(
            'relative hidden p-[22px] lg:flex lg:items-center lg:justify-center',
            imageOrderClass,
          )}
        >
          <div className="relative h-[calc(100vh-44px)] w-full overflow-hidden rounded-[20px]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 0vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* ─── Form panel ─────────────────────────────────────────────── */}
        <div className="flex min-h-screen flex-col px-6 py-10 sm:px-12 lg:px-16">
          {/* Spacer: centres content vertically on desktop */}
          <div className="flex-1" />

          <div className="mx-auto w-full max-w-[340px]">
            {/* Logo + subtitle (rendered as a unit by the Logo component) */}
            <Logo size="lg" href="/" subtitle={subtitle} className="mb-6" />

            {children}
          </div>

          <div className="flex-1" />

          {/* Footer: terms of use */}
          <p className="mx-auto mt-10 w-full max-w-[340px] text-center text-[14px] leading-[20px] tracking-[0.032px] text-neutral sm:text-[16px]">
            {footer ?? (
              <>
                By creating an account you agree to our{' '}
                <Link
                  href="/terms"
                  className="font-semibold text-foreground underline underline-offset-2"
                >
                  Terms of Use
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
