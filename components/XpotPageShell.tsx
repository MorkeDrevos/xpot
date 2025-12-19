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

  // ✅ NEW: true full-bleed slot rendered outside the max-width container
  fullBleedTop?: ReactNode;

  maxWidthClassName?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;

  showTopBar?: boolean;
  topBarClassName?: string;
  topBarProps?: ComponentProps<typeof XpotTopBar>;

  showAtmosphere?: boolean;

  // New feature: explicit page tag (used for styling, telemetry, theming hooks)
  pageTag?: string;
};

function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_50%_110%,rgba(0,0,0,0.75),transparent_60%)]" />

      {/* soft nebula fields */}
      <div
        className="
          absolute -inset-40 opacity-85 blur-3xl
          bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.14),transparent_55%),
              radial-gradient(circle_at_86%_14%,rgba(139,92,246,0.16),transparent_58%),
              radial-gradient(circle_at_78%_92%,rgba(56,189,248,0.12),transparent_60%)]
        "
      />

      {/* subtle diagonal shimmer */}
      <div className="absolute -inset-24 opacity-35 blur-2xl bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.06),transparent)]" />

      {/* top glow line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.25),rgba(16,185,129,0.22),rgba(139,92,246,0.20),transparent)]" />
    </div>
  );
}

export default function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
  fullBleedTop,
  maxWidthClassName = 'max-w-[1440px]',
  className = '',
  containerClassName = '',
  headerClassName = '',
  showTopBar = true,
  topBarClassName = '',
  topBarProps,
  showAtmosphere = true,
  pageTag,
}: XpotPageShellProps) {
  const pathname = usePathname();

  const inferredTag = useMemo(() => {
    if (typeof pathname !== 'string') return undefined;
    if (pathname.startsWith('/ops') || pathname.startsWith('/admin')) return 'ops';
    if (pathname.startsWith('/hub')) return 'hub';
    return undefined;
  }, [pathname]);

  const resolvedPageTag = pageTag || inferredTag;

  // ✅ IMPORTANT: your globals.css uses :root[data-xpot-page="..."]
  // That attribute must live on <html>, not on a div.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const el = document.documentElement;

    if (resolvedPageTag) el.setAttribute('data-xpot-page', resolvedPageTag);
    else el.removeAttribute('data-xpot-page');

    return () => {
      if (!pageTag) {
        el.removeAttribute('data-xpot-page');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedPageTag]);

  const topPad = showTopBar
    ? 'pt-[calc(var(--xpot-banner-h,56px)+112px+24px)]'
    : 'pt-[calc(var(--xpot-banner-h,56px)+24px)]';

  return (
    <div className={['relative min-h-screen text-slate-100', className].join(' ')}>
      {/* Banner is hidden on mobile inside PreLaunchBanner (hidden sm:block) */}
      <PreLaunchBanner />

      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {showAtmosphere && <Atmosphere />}

      {/* ✅ TRUE FULL-BLEED AREA (outside max-width) */}
      {fullBleedTop && <div className={['relative z-10', topPad].join(' ')}>{fullBleedTop}</div>}

      {/* Main container (max-width) */}
      <div
        className={[
          'relative z-10 mx-auto w-full px-4 sm:px-6',
          fullBleedTop ? 'pt-6 sm:pt-8' : topPad,
          'pb-6 sm:pb-8',
          maxWidthClassName,
          containerClassName,
        ].join(' ')}
      >
        {(title || subtitle || rightSlot) && (
          <div
            className={[
              'relative mb-6 overflow-hidden rounded-[30px]',
              'border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02]',
              'shadow-[0_28px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl',
              'px-5 py-5 sm:px-7 sm:py-6',
              'grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center',
              headerClassName,
            ].join(' ')}
          >
            <div
              aria-hidden
              className="
                pointer-events-none absolute -inset-24 opacity-70 blur-3xl
                bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.12),transparent_55%),
                    radial-gradient(circle_at_82%_18%,rgba(139,92,246,0.12),transparent_58%),
                    radial-gradient(circle_at_40%_120%,rgba(16,185,129,0.10),transparent_60%)]
              "
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />

            <div className="relative min-w-0">
              {title && <h1 className="text-[26px] font-semibold text-slate-50 sm:text-[30px]">{title}</h1>}
              {subtitle && <p className="mt-2 text-[14px] text-slate-400 sm:text-[15px]">{subtitle}</p>}
            </div>

            {rightSlot && (
              <div className="relative w-full justify-self-stretch sm:w-auto sm:justify-self-end">
                <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">{rightSlot}</div>
              </div>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
