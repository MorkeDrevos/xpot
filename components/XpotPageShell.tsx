// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

import PreLaunchBanner from '@/components/PreLaunchBanner';
import XpotLogoLottie from '@/components/XpotLogoLottie';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;

  children: ReactNode;

  // Optional fine-tuning
  maxWidthClassName?: string; // default: max-w-[1440px]
  className?: string; // applied to outer wrapper
  containerClassName?: string; // applied to inner container
  headerClassName?: string; // applied to header block (title/subtitle row)

  // Global top bar (logo row)
  showTopBar?: boolean;
  topBarRightSlot?: ReactNode;
};

export default function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
  maxWidthClassName = 'max-w-[1440px]',
  className = '',
  containerClassName = '',
  headerClassName = '',
  showTopBar = true,
  topBarRightSlot,
}: XpotPageShellProps) {
  return (
    <div
      className={`relative min-h-screen bg-[#02020a] text-slate-100 ${className}`}
    >
      <PreLaunchBanner />

      {/* GLOBAL NEBULA BACKGROUND (fixed, always visible) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#02020a]" />
      <div
        className="
          pointer-events-none fixed inset-0 -z-10
          opacity-95
          bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,0.45),transparent_60%),
              radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.55),transparent_60%),
              radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.45),transparent_65%),
              radial-gradient(circle_at_35%_85%,rgba(56,189,248,0.18),transparent_55%)]
        "
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

      {/* CONTENT CONTAINER */}
      <div
        className={[
          'relative z-10 mx-auto w-full px-4 sm:px-6',
          // banner is fixed at top, so push content down
          'pt-16 pb-6 sm:pb-8',
          maxWidthClassName,
          containerClassName,
        ].join(' ')}
      >
        {/* GLOBAL TOP BAR (consistent logo everywhere) */}
        {showTopBar && (
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <XpotLogoLottie className="h-10 w-32" />
            </Link>

            {topBarRightSlot ? (
              <div className="shrink-0">{topBarRightSlot}</div>
            ) : null}
          </div>
        )}

        {/* PAGE HEADER (optional) */}
        {(title || subtitle || rightSlot) && (
          <div
            className={[
              'mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
              headerClassName,
            ].join(' ')}
          >
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-slate-50">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>

            {rightSlot && <div className="shrink-0">{rightSlot}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
