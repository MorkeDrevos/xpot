// components/OpsThemeSwitcher.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type ThemeKey = 'nebula' | 'icy' | 'royal';

const STORAGE_KEY = 'xpot_ops_theme';

const THEMES: { key: ThemeKey; label: string }[] = [
  { key: 'nebula', label: 'Nebula' },
  { key: 'icy', label: 'Icy' },
  { key: 'royal', label: 'Royal' },
];

function applyTheme(theme: ThemeKey) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export default function OpsThemeSwitcher({
  defaultTheme = 'nebula',
}: {
  defaultTheme?: ThemeKey;
}) {
  const [theme, setTheme] = useState<ThemeKey>(defaultTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    const initial = saved && THEMES.some(t => t.key === saved) ? saved : defaultTheme;

    setTheme(initial);
    applyTheme(initial);
  }, [defaultTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const activeIndex = useMemo(() => THEMES.findIndex(t => t.key === theme), [theme]);

  return (
    <div className="inline-flex items-center gap-3">
      <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
        Theme
      </span>

      <div className="relative inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
        {/* Active pill */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200"
          style={{
            left: `calc(${activeIndex} * 84px + 4px)`,
            width: '84px',
          }}
        />

        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTheme(t.key)}
            className={[
              'relative z-10 h-10 w-[84px] rounded-full px-4 text-sm font-semibold transition',
              t.key === theme ? 'text-slate-100' : 'text-slate-300 hover:text-slate-100',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
