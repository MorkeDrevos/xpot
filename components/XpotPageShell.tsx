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

  // ✅ full-bleed content rendered above the normal container (edge-to-edge hero)
  fullBleedTop?: ReactNode;

  maxWidthClassName?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;

  showTopBar?: boolean;
  topBarClassName?: string;
  topBarProps?: ComponentProps<typeof XpotTopBar>;

  /**
   * Deprecated: previously rendered the "xpot-atmosphere" overlay (stars).
   * Kept so existing call sites don't break, but stars layer is removed.
   */
  showAtmosphere?: boolean;

  // Deprecated UI feature: no longer used (NO THEME SWITCHING)
  showOpsThemeSwitcher?: boolean;

  // Explicit page tag used for styling hooks (ops, hub etc)
  pageTag?: string;
};

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

  // kept only so existing callers don't break
  showAtmosphere,

  // kept for compatibility (NO THEME SWITCHING - ignored)
  showOpsThemeSwitcher,

  pageTag,
}: XpotPageShellProps) {
  void showAtmosphere;
  void showOpsThemeSwitcher;

  const pathname = usePathname();

  const inferredTag = useMemo(() => {
    if (typeof pathname !== 'string') return undefined;
    if (pathname.startsWith('/ops') || pathname.startsWith('/admin')) return 'ops';
    if (pathname.startsWith('/hub')) return 'hub';
    return undefined;
  }, [pathname]);

  const resolvedPageTag = pageTag || inferredTag;

  // ✅ IMPORTANT: set data-xpot-page on <html> (so :root[data-xpot-page="ops"] works)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (resolvedPageTag) root.setAttribute('data-xpot-page', resolvedPageTag);
    else root.removeAttribute('data-xpot-page');

    return () => {
      // Only remove if we set it (prevents clobbering other pages during fast nav)
      if (!resolvedPageTag) return;
      if (root.getAttribute('data-xpot-page') === resolvedPageTag) {
        root.removeAttribute('data-xpot-page');
      }
    };
  }, [resolvedPageTag]);

  const mergedRightSlot = useMemo(() => rightSlot ?? null, [rightSlot]);

  return (
    <div className={['relative min-h-screen text-slate-100', className].join(' ')}>
      {/* Banner is hidden on mobile inside PreLaunchBanner (hidden sm:block) */}
      <PreLaunchBanner />

      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {/* ✅ Atmosphere (stars) removed */}

      {/* ✅ Full-bleed slot (edge-to-edge hero). No padding here on purpose. */}
      {fullBleedTop ? <div className="relative z-10 w-full">{fullBleedTop}</div> : null}

      <div
        className={[
          'relative z-10 mx-auto w-full px-4 sm:px-6',
          showTopBar
            ? 'pt-[calc(var(--xpot-banner-h,56px)+var(--xpot-topbar-h,112px)+24px)]'
            : 'pt-[calc(var(--xpot-banner-h,56px)+24px)]',
          'pb-6 sm:pb-8',
          maxWidthClassName,
          containerClassName,
        ].join(' ')}
      >
        {(title || subtitle || mergedRightSlot) && (
          <div
            className={[
              'mb-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur',
              'px-5 py-5 sm:px-7 sm:py-6',
              'grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center',
              headerClassName,
            ].join(' ')}
          >
            <div className="min-w-0">
              {title && <h1 className="text-[26px] font-semibold text-slate-50 sm:text-[30px]">{title}</h1>}
              {subtitle && <p className="mt-2 text-[14px] text-slate-400 sm:text-[15px]">{subtitle}</p>}
            </div>

            {mergedRightSlot && (
              <div className="w-full justify-self-stretch sm:w-auto sm:justify-self-end">
                <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                  {mergedRightSlot}
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
