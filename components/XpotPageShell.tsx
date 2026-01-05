// components/XpotPageShell.tsx
'use client';

import { ReactNode, ComponentProps, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

  // Optional: disable ambient background on special pages
  ambientBg?: boolean;

  // ✅ Premium auto-refresh (router.refresh) across pages using the shell
  autoRefresh?: boolean;
  autoRefreshMs?: number; // if omitted, uses XPOT defaults based on pageTag
  autoRefreshJitterMs?: number; // random stagger to avoid synchronized refresh
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
  ambientBg = true,

  autoRefresh = true,
  autoRefreshMs,
  autoRefreshJitterMs = 900,
}: XpotPageShellProps) {
  void showAtmosphere;
  void showOpsThemeSwitcher;

  const pathname = usePathname();
  const router = useRouter();

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
      if (!resolvedPageTag) return;
      if (root.getAttribute('data-xpot-page') === resolvedPageTag) {
        root.removeAttribute('data-xpot-page');
      }
    };
  }, [resolvedPageTag]);

  const mergedRightSlot = useMemo(() => rightSlot ?? null, [rightSlot]);

  /**
   * ✅ XPOT Premium Auto Refresh
   * - Uses router.refresh() (App Router friendly)
   * - Adds jitter (stagger) so multi-tabs/users don't refresh at the same millisecond
   * - Pauses when tab is hidden, resumes when visible
   */
  const refreshMsResolved = useMemo(() => {
    if (typeof autoRefreshMs === 'number' && autoRefreshMs > 0) return autoRefreshMs;

    // XPOT defaults (calm, premium - not spammy)
    if (resolvedPageTag === 'ops') return 6500; // ops: slightly tighter
    if (resolvedPageTag === 'hub') return 12000; // hub: calmer
    return 15000; // general
  }, [autoRefreshMs, resolvedPageTag]);

  const intervalRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoRefresh) return;
    if (typeof window === 'undefined') return;

    const clearAll = () => {
      if (startTimeoutRef.current !== null) {
        window.clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (resumeTimeoutRef.current !== null) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startInterval = () => {
      if (intervalRef.current !== null) return;

      intervalRef.current = window.setInterval(() => {
        if (document.hidden) return;
        router.refresh();
      }, refreshMsResolved);
    };

    const scheduleStart = () => {
      clearAll();

      // stagger start so it feels organic
      const jitter = Math.max(0, autoRefreshJitterMs || 0);
      const startDelay = jitter ? Math.floor(Math.random() * jitter) : 0;

      startTimeoutRef.current = window.setTimeout(() => {
        // first refresh should not be instant - wait full interval
        startInterval();
      }, startDelay);
    };

    const onVis = () => {
      if (document.hidden) return;

      // Resume cleanly: one gentle refresh, then restart interval after a tiny delay
      clearAll();
      router.refresh();
      resumeTimeoutRef.current = window.setTimeout(() => {
        scheduleStart();
      }, 250);
    };

    scheduleStart();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clearAll();
    };
  }, [autoRefresh, autoRefreshJitterMs, refreshMsResolved, router]);

  /**
   * One source of truth: header offset var
   * - PreLaunchBanner maintains --xpot-banner-h (0 when hidden)
   * - TopBar maintains --xpot-topbar-h
   *
   * ✅ IMPORTANT FIX:
   * banner fallback must be 0px, not 56px (banner is hidden on mobile)
   */
  const headerOffsetVar = showTopBar
    ? 'calc(var(--xpot-banner-h, 0px) + var(--xpot-topbar-h, 0px))'
    : 'var(--xpot-banner-h, 0px)';

  // If we render a full-bleed hero, we do NOT add header offset again on the container.
  const containerPaddingTop = fullBleedTop
    ? '24px'
    : showTopBar
      ? 'calc(var(--xpot-header-offset, 0px) + 24px)'
      : 'calc(var(--xpot-header-offset, 0px) + 24px)';

  return (
    <div
      className={['relative min-h-screen text-slate-100 overflow-x-hidden', className].join(' ')}
      style={{ ['--xpot-header-offset' as any]: headerOffsetVar }}
    >
      {/* Ambient background (same vibe as footer) */}
      {ambientBg ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          {/* Base */}
          <div className="absolute inset-0 bg-[#060912]" />

          {/* Soft nebula glows */}
          <div
            className="absolute inset-0 opacity-[0.95]"
            style={{
              background:
                'radial-gradient(1100px 700px at 12% 18%, rgba(16,185,129,0.18), transparent 60%),' +
                'radial-gradient(900px 600px at 88% 22%, rgba(168,85,247,0.18), transparent 62%),' +
                'radial-gradient(900px 700px at 78% 78%, rgba(56,189,248,0.12), transparent 60%),' +
                'radial-gradient(800px 600px at 22% 82%, rgba(245,158,11,0.10), transparent 60%)',
            }}
          />

          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px), ' +
                'linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 55%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(80% 70% at 50% 30%, #000 55%, transparent 100%)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 opacity-[0.9]"
            style={{
              background:
                'radial-gradient(1200px 800px at 50% 25%, transparent 55%, rgba(0,0,0,0.70) 100%)',
            }}
          />
        </div>
      ) : null}

      {/* Content layer */}
      <div className="relative z-10">
        {/* Banner should set --xpot-banner-h to 0 when hidden on mobile */}
        <PreLaunchBanner hidden />

        {showTopBar && (
          <div className={topBarClassName}>
            <XpotTopBar {...topBarProps} />
          </div>
        )}

        {/* ✅ Full-bleed hero: edge-to-edge. */}
        {fullBleedTop ? <div className="relative w-full">{fullBleedTop}</div> : null}

        {/* Normal page container */}
        <div
          className={[
            'relative mx-auto w-full px-4 sm:px-6',
            'pb-6 sm:pb-8',
            maxWidthClassName,
            containerClassName,
          ].join(' ')}
          style={{ paddingTop: containerPaddingTop }}
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
    </div>
  );
}
