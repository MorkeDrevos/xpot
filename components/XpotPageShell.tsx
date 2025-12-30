// components/XpotPageShell.tsx
'use client';

import { ReactNode, ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
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

  // ✅ Premium auto-refresh (client-side router.refresh)
  autoRefresh?: boolean;
  autoRefreshIntervalMs?: number;

  // Optional: show subtle "LIVE refresh" indicator pill
  showAutoRefreshPill?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  // kept only so existing callers don't break
  showAtmosphere,

  // kept for compatibility (NO THEME SWITCHING - ignored)
  showOpsThemeSwitcher,

  pageTag,
  ambientBg = true,

  // ✅ defaults: enabled and smooth
  autoRefresh = true,
  autoRefreshIntervalMs = 15_000,
  showAutoRefreshPill = true,
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
   * One source of truth: header offset var
   * - PreLaunchBanner maintains --xpot-banner-h
   * - TopBar maintains --xpot-topbar-h
   */
  const headerOffsetVar = showTopBar
    ? 'calc(var(--xpot-banner-h,56px) + var(--xpot-topbar-h,112px))'
    : 'var(--xpot-banner-h,56px)';

  // If we render a full-bleed hero, we do NOT add header offset again on the container.
  const containerPaddingTop = fullBleedTop
    ? '24px'
    : showTopBar
      ? 'calc(var(--xpot-header-offset,168px) + 24px)'
      : 'calc(var(--xpot-header-offset,56px) + 24px)';

  // ─────────────────────────────────────────────
  // Premium auto-refresh (soft refresh, no reload)
  // - Pauses when tab is hidden
  // - Adds slight jitter so many clients do not slam at same millisecond
  // - Small pill indicator with pulse
  // ─────────────────────────────────────────────

  const [refreshPulse, setRefreshPulse] = useState(false);
  const lastRefreshAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const intervalMs = useMemo(() => {
    // Keep sane boundaries so we never DoS ourselves
    return clamp(autoRefreshIntervalMs, 5_000, 120_000);
  }, [autoRefreshIntervalMs]);

  useEffect(() => {
    if (!autoRefresh) return;
    if (typeof window === 'undefined') return;

    const clear = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clear();

      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      if (hidden) return;

      // ±12% jitter (premium feel, avoids thundering herd)
      const jitter = Math.round(intervalMs * 0.12);
      const delay = intervalMs + Math.round((Math.random() * 2 - 1) * jitter);

      timerRef.current = window.setTimeout(() => {
        const now = Date.now();

        // Safety: do not refresh more often than 4s even if something misfires
        if (now - lastRefreshAtRef.current >= 4_000) {
          lastRefreshAtRef.current = now;

          // visual pulse for the indicator
          setRefreshPulse(true);
          window.setTimeout(() => setRefreshPulse(false), 650);

          router.refresh();
        }

        scheduleNext();
      }, delay) as unknown as number;
    };

    const onVis = () => scheduleNext();

    scheduleNext();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      clear();
    };
  }, [autoRefresh, intervalMs, router]);

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
        {/* Banner is hidden on mobile inside PreLaunchBanner (hidden sm:block) */}
        <PreLaunchBanner />

        {showTopBar && (
          <div className={topBarClassName}>
            <XpotTopBar {...topBarProps} />
          </div>
        )}

        {/* ✅ Premium auto-refresh indicator (subtle, XPOT style) */}
        {autoRefresh && showAutoRefreshPill ? (
          <div
            className="pointer-events-none fixed right-4 top-[calc(var(--xpot-header-offset,168px)+14px)] z-[80] hidden sm:block"
            aria-hidden
          >
            <div
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1',
                'border-white/10 bg-white/[0.04] backdrop-blur-md',
                'shadow-[0_18px_70px_rgba(0,0,0,0.45)]',
                refreshPulse ? 'ring-2 ring-emerald-400/25' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'h-2 w-2 rounded-full',
                  refreshPulse
                    ? 'bg-emerald-300 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]'
                    : 'bg-emerald-300/70 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]',
                ].join(' ')}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                Live refresh
              </span>
            </div>
          </div>
        ) : null}

        {/* ✅ Full-bleed hero: edge-to-edge.
            IMPORTANT: do NOT pad by header offset here if your hero already includes its own spacer. */}
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
