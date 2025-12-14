'use client';

import { ReactNode } from 'react';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import XpotTopBar from '@/components/XpotTopBar';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;

  children: ReactNode;

  maxWidthClassName?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;

  showTopBar?: boolean;
  topBarClassName?: string;
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
  topBarClassName = '',
}: XpotPageShellProps) {
  return (
    <div
      className={[
        'relative min-h-screen bg-[#02020a] text-slate-100',
        className,
      ].join(' ')}
    >
      {/* Fixed banner at top */}
      <PreLaunchBanner />

      {/* Fixed top bar – sits directly under banner */}
      {showTopBar && (
        <div className={['fixed inset-x-0 z-[60]', topBarClassName].join(' ')}>
          <XpotTopBar />
        </div>
      )}

      {/* Nebula background */}
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

      {/* CONTENT */}
      <div
        className={[
          'relative z-10 mx-auto w-full px-4 sm:px-6',
          // ✅ precise spacing: banner + topbar + breathing room
          'pt-[calc(var(--xpot-banner-h,56px)+104px+24px)] pb-6 sm:pb-8',
          maxWidthClassName,
          containerClassName,
        ].join(' ')}
      >
        {(title || subtitle || rightSlot) && (
          <div
            className={[
              'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
              headerClassName,
            ].join(' ')}
          >
            <div className="min-w-0">
              {title && (
                <h1 className="text-xl font-semibold text-slate-50">
                  {title}
                </h1>
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
