// components/XpotLogo.tsx
'use client';

import XpotLogoLottie from './XpotLogoLottie';

type XpotLogoProps = {
  className?: string;
  withText?: boolean;
};

export default function XpotLogo({
  className = '',
  withText = true,
}: XpotLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <XpotLogoLottie className="h-10 w-10" />
      {withText && (
        <span className="text-xl font-semibold tracking-tight">
          XPOT
        </span>
      )}
    </div>
  );
}
