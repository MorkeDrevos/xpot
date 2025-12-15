// components/XpotPageShell.tsx
'use client';

import { ReactNode, ComponentProps } from 'react';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import XpotTopBar from '@/components/XpotTopBar';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;

  children: ReactNode;

  // Optional fine-tuning
  maxWidthClassName?: string; // default: max-w-[1440px]
  className?: string; // applied to outer wrapper
  containerClassName?: string; // applied to inner container
  headerClassName?: string; // applied to header block (title/subtitle/rightSlot)

  // Page tag (used by callers for semantics, analytics, styling hooks)
  pageTag?: string;

  // Top bar controls
  showTopBar?: boolean; // default true
  topBarClassName?: string; // optional wrapper class
  topBarProps?: ComponentProps<typeof XpotTopBar>; // ✅ NEW
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
  pageTag,
  showTopBar = true,
  topBarClassName = '',
  topBarProps,
}: XpotPageShellProps) {
  return (
    <div
      data-page={pageTag}
      className={[
        'relative min-h-screen bg-[#02020a] text-slate-100',
        className,
      ].join(' ')}
    >
      <PreLaunchBanner />

      {/* GLOBAL TOP BAR (TopBar itself is fixed; don't wrap in sticky) */}
      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {/* Base solid */}
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[#02020a]" />

      {/* Nebula glow layers */}
      <div
        className="
          pointer-events-none fixed inset-0 -z-20
          opacity-95
          bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,0.45),transparent_60%),
              radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.55),transparent_60%),
              radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.45),transparent_65%),
              radial-gradient(circle_at_35%_85%,rgba(56,189,248,0.18),transparent_55%)]
        "
      />

      {/* ⭐ Bright starfield */}
      <div
        aria-hidden
        className="
          pointer-events-none fixed inset-0 -z-10
          opacity-60 mix-blend-screen
        "
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 12px 18px, rgba(255,255,255,0.95) 99%, transparent 100%),
            radial-gradient(1px 1px at 42px 58px, rgba(255,255,255,0.70) 99%, transparent 100%),
            radial-gradient(1px 1px at 88px 24px, rgba(255,255,255,0.55) 99%, transparent 100%),
            radial-gradient(1.5px 1.5px at 64px 92px, rgba(255,255,255,0.55) 99%, transparent 100%),
            radial-gradient(2px 2px at 110px 76px, rgba(255,255,255,0.35) 99%, transparent 100%),

            radial-gradient(1px 1px at 18px 90px, rgba(255,255,255,0.85) 99%, transparent 100%),
            radial-gradient(1px 1px at 70px 10px, rgba(255,255,255,0.65) 99%, transparent 100%),
            radial-gradient(1px 1px at 120px 40px, rgba(255,255,255,0.50) 99%, transparent 100%)
          `,
          backgroundSize: '140px 140px',
          backgroundPosition: '0 0',
          filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.12))',
        }}
      />

      {/* Vignette / depth mask */}
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

      {/* CONTENT CONTAINER */}
      <div
        className={[
          'relative z-10 mx-auto w-full px-4 sm:px-6',
          showTopBar
            ? 'pt-[calc(var(--xpot-banner-h,56px)+112px+24px)]'
            : 'pt-[calc(var(--xpot-banner-h,56px)+24px)]',
          'pb-6 sm:pb-8',
          maxWidthClassName,
          containerClassName,
        ].join(' ')}
      >
        {(title || subtitle || rightSlot) && (
          <div
            className={[
              'mb-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur',
              'px-5 py-5 sm:px-7 sm:py-6',
              'grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center',
              headerClassName,
            ].join(' ')}
          >
            <div className="min-w-0">
              {title && (
                <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-slate-50">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-[14px] sm:text-[15px] text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>

            {rightSlot && (
              <div className="w-full justify-self-stretch sm:w-auto sm:justify-self-end">
                <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                  {rightSlot}
                </div>
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
