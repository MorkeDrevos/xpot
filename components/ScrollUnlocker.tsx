'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function unlock() {
  if (typeof document === 'undefined') return;

  const b = document.body;
  const e = document.documentElement;

  b.style.overflow = '';
  b.style.position = '';
  b.style.top = '';
  b.style.width = '';
  e.style.overflow = '';
}

export default function ScrollUnlocker() {
  const pathname = usePathname();

  // Always unlock on route change (covers “modal open -> navigate -> stuck”)
  useEffect(() => {
    unlock();
  }, [pathname]);

  // Also unlock after runtime errors/rejections (covers “modal open -> React error -> stuck”)
  useEffect(() => {
    const onErr = () => unlock();
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onErr);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
    };
  }, []);

  return null;
}
