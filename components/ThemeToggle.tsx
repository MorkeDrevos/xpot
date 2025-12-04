'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // 1) from localStorage
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem('xpot-theme')
      : null;

    // 2) from system preference
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initial: Theme =
      (stored === 'dark' || stored === 'light'
        ? (stored as Theme)
        : prefersDark
        ? 'dark'
        : 'dark'); // default to dark anyway

    setTheme(initial);
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    window.localStorage.setItem('xpot-theme', next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-lg backdrop-blur-md hover:bg-slate-800/80 hover:border-slate-400/80 transition"
    >
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/90 text-[10px] font-bold text-slate-950"
        aria-hidden="true"
      >
        {theme === 'dark' ? '☾' : '☼'}
      </span>
      <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}
