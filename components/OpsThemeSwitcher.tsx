'use client';

import { useEffect, useState } from 'react';

const THEMES = [
  { key: 'nebula', label: 'Nebula' },
  { key: 'emerald', label: 'Emerald' },
  { key: 'amber', label: 'Amber' },
  { key: 'crimson', label: 'Crimson' },
] as const;

const STORAGE_KEY = 'xpot-theme';

function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export default function OpsThemeSwitcher() {
  const [active, setActive] = useState<string>('nebula');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'nebula';
    setTheme(saved);
    setActive(saved);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        Theme
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {THEMES.map(t => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTheme(t.key);
                setActive(t.key);
              }}
              className={[
                'xpot-btn px-3 py-1 text-[11px]',
                on ? 'xpot-btn-primary' : '',
              ].join(' ')}
              aria-pressed={on}
              title={`Switch theme to ${t.label}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
