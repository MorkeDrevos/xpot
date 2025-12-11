// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';

export function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: {
  title?: string,
  subtitle?: string,
  rightSlot?: ReactNode,
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen text-slate-50">
      <div
        className="
          absolute inset-0 -z-10 
          bg-[url('/nebula-banner.jpg')]
          bg-cover bg-center
          opacity-[0.22]
        "
      />
      
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-12">
        
        {title && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            {rightSlot}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
