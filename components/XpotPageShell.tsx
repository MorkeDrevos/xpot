// components/XpotPageShell.tsx
'use client';

import { ReactNode, ComponentProps, useEffect, useMemo, useState } from 'react';
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

  // Keep your existing feature
  showOpsThemeSwitcher?: boolean;

  // Explicit page tag (used for styling, telemetry, theming hooks)
  pageTag?: string;
};

const THEME_KEY = 'xpot_ops_theme_v1';

type ThemePreset = {
  id: string;
  label: string;
  vars: Record<string, string>;
};

// Your requested anchors (blue -> violet -> magenta)
const PRESETS: ThemePreset[] = [
  {
    id: 'nebula',
    label: 'Nebula',
    vars: {
      '--xpot-accent-blue': '56 189 248',
      '--xpot-accent-violet': '99 102 241',
      '--xpot-accent-magenta': '236 72 153',
      '--xpot-accent-emerald': '16 185 129',
    },
  },
  {
    id: 'icy',
    label: 'Icy',
    vars: {
      '--xpot-accent-blue': '34 211 238',
      '--xpot-accent-violet': '129 140 248',
      '--xpot-accent-magenta': '244 114 182',
      '--xpot-accent-emerald': '16 185 129',
    },
  },
  {
    id: 'royal',
    label: 'Royal',
    vars: {
      '--xpot-accent-blue': '96 165 250',
      '--xpot-accent-violet': '139 92 246',
      '--xpot-accent-magenta': '236 72 153',
      '--xpot-accent-emerald': '16 185 129',
    },
  },
];

function applyPreset(presetId: string) {
  const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0];
  const root = document.documentElement;

  for (const [k, v] of Object.entries(preset.vars)) {
    root.style.setProperty(k, v);
  }

  // Keep compat with older name used in some places
  root.style.setProperty('--xpot-accent-purple', `var(--xpot-accent-violet)`);

  window.localStorage.setItem(THEME_KEY, preset.id);
}

function OpsThemeSwitcher() {
  const [active, setActive] = useState<string>('nebula');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
    const initial = saved && PRESETS.some(p => p.id === saved) ? saved : 'nebula';
    setActive(initial);
    applyPreset(initial);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Theme</span>

      <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.03] backdrop-blur">
        {PRESETS.map(p => {
          const isActive = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActive(p.id);
                applyPreset(p.id);
              }}
              className={[
                'h-8 px-3 text-[11px] font-semibold transition',
                isActive ? 'bg-white/[0.10] text-slate-50' : 'text-slate-300 hover:bg-white/[0.06]',
              ].join(' ')}
              title={`Apply ${p.label}`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  showOpsThemeSwitcher = true,
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
  const isOpsOrAdmin = resolvedPageTag === 'ops';

  const mergedRightSlot = useMemo(() => {
    if (!isOpsOrAdmin || !showOpsThemeSwitcher) return rightSlot ?? null;

    return (
      <>
        <OpsThemeSwitcher />
        {rightSlot ? <div className="ml-2">{rightSlot}</div> : null}
      </>
    );
  }, [isOpsOrAdmin, rightSlot, showOpsThemeSwitcher]);

  // IMPORTANT: your globals.css page modes use :root[data-xpot-page="..."]
  // That selector applies to <html>. So we set it on documentElement.
  useEffect(() => {
    const root = document.documentElement;
    if (!resolvedPageTag) {
      root.removeAttribute('data-xpot-page');
      return;
    }
    root.setAttribute('data-xpot-page', resolvedPageTag);
    return () => {
      // If you navigate away and another page shell mounts, it will set its own value
    };
  }, [resolvedPageTag]);

  return (
    <div
      className={['relative min-h-screen bg-[#02020a] text-slate-100', className].join(' ')}
      data-xpot-page={resolvedPageTag}
    >
      {/* Banner is hidden on mobile inside PreLaunchBanner (hidden sm:block) */}
      <PreLaunchBanner />

      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {showAtmosphere && <div aria-hidden className="xpot-atmosphere" />}

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
