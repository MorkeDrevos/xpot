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

  // Optional fine-tuning
  maxWidthClassName?: string; // default: max-w-[1440px]
  className?: string; // applied to outer wrapper
  containerClassName?: string; // applied to inner container
  headerClassName?: string; // applied to header block (title/subtitle/rightSlot)

  // Top bar controls
  showTopBar?: boolean; // default true
  topBarClassName?: string; // optional wrapper class
  topBarProps?: ComponentProps<typeof XpotTopBar>;

  // Theme switcher (Ops/Admin only)
  showOpsThemeSwitcher?: boolean; // default true
};

const THEME_KEY = 'xpot_ops_theme_v1';

type ThemeId = 'nebula' | 'icy' | 'royal';

type ThemePreset = {
  id: ThemeId;
  label: string;

  // Fallback overrides (in case globals.css does not yet define html[data-theme="icy"/"royal"])
  // These are the aliases your components should use.
  overrides: Partial<
    Record<
      | '--xpot-accent-primary'
      | '--xpot-accent-secondary'
      | '--xpot-accent-glow'
      | '--xpot-accent-success',
      string
    >
  >;
};

const PRESETS: ThemePreset[] = [
  {
    id: 'nebula',
    label: 'Nebula',
    overrides: {
      '--xpot-accent-primary': '56 189 248',
      '--xpot-accent-secondary': '99 102 241',
      '--xpot-accent-glow': '236 72 153',
      '--xpot-accent-success': '16 185 129',
    },
  },
  {
    id: 'icy',
    label: 'Icy',
    overrides: {
      '--xpot-accent-primary': '34 211 238',
      '--xpot-accent-secondary': '129 140 248',
      '--xpot-accent-glow': '244 114 182',
      '--xpot-accent-success': '16 185 129',
    },
  },
  {
    id: 'royal',
    label: 'Royal',
    overrides: {
      '--xpot-accent-primary': '96 165 250',
      '--xpot-accent-secondary': '139 92 246',
      '--xpot-accent-glow': '236 72 153',
      '--xpot-accent-success': '16 185 129',
    },
  },
];

function isThemeId(v: any): v is ThemeId {
  return v === 'nebula' || v === 'icy' || v === 'royal';
}

function applyTheme(theme: ThemeId) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  root.dataset.theme = theme;

  // Clear any previous inline overrides first (keeps switching clean)
  root.style.removeProperty('--xpot-accent-primary');
  root.style.removeProperty('--xpot-accent-secondary');
  root.style.removeProperty('--xpot-accent-glow');
  root.style.removeProperty('--xpot-accent-success');

  // Fallback: if globals.css does not define this theme yet, we still want visible changes.
  // This only touches the alias variables (new components should use these).
  const preset = PRESETS.find(p => p.id === theme) ?? PRESETS[0];
  for (const [k, v] of Object.entries(preset.overrides)) {
    if (!v) continue;
    root.style.setProperty(k as any, v);
  }

  // Compat for older code that still references “purple”
  root.style.setProperty('--xpot-accent-purple', 'var(--xpot-accent-secondary)');

  window.localStorage.setItem(THEME_KEY, theme);
}

function OpsThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>('nebula');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(THEME_KEY);
    const initial: ThemeId = isThemeId(saved) ? saved : 'nebula';

    setActive(initial);
    applyTheme(initial);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
        Theme
      </span>

      <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.03] backdrop-blur">
        {PRESETS.map(p => {
          const isActive = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActive(p.id);
                applyTheme(p.id);
              }}
              className={[
                'h-8 px-3 text-[11px] font-semibold transition',
                isActive
                  ? 'bg-white/[0.10] text-slate-50'
                  : 'text-slate-300 hover:bg-white/[0.06]',
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
  showOpsThemeSwitcher = true,
}: XpotPageShellProps) {
  const pathname = usePathname() || '';

  const isOpsOrAdmin = useMemo(() => {
    return pathname.startsWith('/ops') || pathname.startsWith('/admin');
  }, [pathname]);

  // Put the ops flag on <html> so globals.css selectors actually affect page bg/borders.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (isOpsOrAdmin) root.setAttribute('data-xpot-page', 'ops');
    else root.removeAttribute('data-xpot-page');

    return () => {
      root.removeAttribute('data-xpot-page');
    };
  }, [isOpsOrAdmin]);

  const mergedRightSlot = useMemo(() => {
    if (!isOpsOrAdmin || !showOpsThemeSwitcher) return rightSlot ?? null;

    return (
      <>
        <OpsThemeSwitcher />
        {rightSlot ? <div className="ml-2">{rightSlot}</div> : null}
      </>
    );
  }, [isOpsOrAdmin, rightSlot, showOpsThemeSwitcher]);

  return (
    <div className={['relative min-h-screen text-slate-100', className].join(' ')}>
      <PreLaunchBanner />

      {/* GLOBAL TOP BAR (TopBar itself is fixed; don't wrap in sticky) */}
      {showTopBar && (
        <div className={topBarClassName}>
          <XpotTopBar {...topBarProps} />
        </div>
      )}

      {/* Page background comes from globals.css via --xpot-bg-page */}
      <div className="pointer-events-none fixed inset-0 -z-30 bg-[var(--xpot-bg-page)]" />

      {/* Bright starfield */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20 opacity-60 mix-blend-screen"
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
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

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
