// components/ThemeHydrator.tsx
'use client';

import { useEffect } from 'react';

const THEME_KEY = 'xpot_ops_theme_v1';

export default function ThemeHydrator() {
  useEffect(() => {
    const saved =
      (localStorage.getItem(THEME_KEY) as
        | 'nebula'
        | 'icy'
        | 'royal'
        | null) ?? 'nebula';

    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return null;
}
