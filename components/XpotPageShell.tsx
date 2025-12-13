// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';

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
  showHeader?: boolean;
};

export default function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
  maxWidthClassName = 'max-w-[1440px]',
  className = '',
  containerClassName = '',
  headerClassName = '',
  showHeader = true,
}: XpotPageShellProps) {
  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      <div className={`mx-auto w-full px-4 py-6 ${maxWidthClassName} ${containerClassName}`}>
        {showHeader && (title || subtitle || rightSlot) ? (
          <header className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${headerClassName}`}>
            <div>
              {title ? <h1 className="text-2xl font-semibold">{title}</h1> : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
            </div>
            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </header>
        ) : null}

        {children}
      </div>
    </div>
  );
}
