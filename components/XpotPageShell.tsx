// components/XpotPageShell.tsx
'use client';

import { ReactNode, ComponentProps, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

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
  topBarProps?: ComponentProps<typeof XpotTopBar>;

  showAtmosphere?: boolean;
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
  topBarProps,
  showAtmosphere = true,
}: XpotPageShellProps) {
  const pathname = usePathname() || '';

  const pageKey = useMemo(() => {
    if (pathname.startsWith('/ops') || pathname.startsWith('/admin')) return 'ops';
    if (pathname.startsWith('/hub')) return 'hub';
    return 'site';
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-xpot-page', pageKey);
    return () => {
      // keep it deterministic - no cleanup needed
    };
  }, [pageKey]);

  return (
    <div className={['xpot-page relative min-h-screen text-slate-100', className].join(' ')}>
      <PreLaunchBanner />

      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {showAtmosphere && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-20 opacity-60 mix-blend-screen"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 12px 18px, rgba(255,255,255,0.95) 99%, transparent 100%),
                radial-gradient(1px 1px at 42px 58px, rgba(255,255,255,0.70) 99%, transparent 100%),
                radial-gradient(1px 1px at 88px 24px, rgba(255,255,255,0.55) 99%, transparent 100%)
              `,
              backgroundSize: '140px 140px',
              backgroundPosition: '0 0',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.12))',
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
              background:
                'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.65) 72%, rgba(0,0,0,0.85) 100%)',
            }}
          />
        </>
      )}

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
              {title && <h1 className="text-[26px] sm:text-[30px] font-semibold text-slate-50">{title}</h1>}
              {subtitle && <p className="mt-2 text-[14px] sm:text-[15px] text-slate-400">{subtitle}</p>}
            </div>

            {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
