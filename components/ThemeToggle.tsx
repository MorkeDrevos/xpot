'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const mode = saved || (prefers ? 'dark' : 'light');
    setTheme(mode as any);
    document.documentElement.classList.toggle('light', mode === 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
    localStorage.setItem('theme', next);
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800 transition"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
