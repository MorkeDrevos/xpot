'use client';

import XpotLogo from '@/components/XpotLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { XpotSignInModal } from './XpotSignInModal';   // <-- FIXED

export default function XpotTopBar() {
  return (
    <div className="flex items-center justify-between py-4 px-6">
      <XpotLogo />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <XpotSignInModal />
      </div>
    </div>
  );
}
