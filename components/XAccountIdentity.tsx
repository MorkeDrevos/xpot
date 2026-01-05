'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export type XAccountIdentityProps = {
  name?: string | null;
  handle: string | null;
  avatarUrl?: string | null;
  verified?: boolean | null;

  showExternalIcon?: boolean;
  subtitle?: string | null;

  /** NEW: avatar size in px (default = 48) */
  size?: number;

  className?: string;
};

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function XVerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={[
        'inline-flex h-5 w-5 items-center justify-center',
        'rounded-full bg-[#1d9bf0] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
        className,
      ].join(' ')}
      aria-label="Verified"
      title="Verified"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.285 6.709a1 1 0 0 1 0 1.414l-9.19 9.19a1 1 0 0 1-1.414 0l-4.243-4.243a1 1 0 1 1 1.414-1.414l3.536 3.536 8.483-8.483a1 1 0 0 1 1.414 0z"
        />
      </svg>
    </span>
  );
}

export default function XAccountIdentity({
  name,
  handle,
  avatarUrl,
  verified,
  showExternalIcon = true,
  subtitle,
  size = 48, // ✅ default stays exactly like today
  className = '',
}: XAccountIdentityProps) {
  const h = normalizeHandle(handle);
  const href = toXProfileUrl(h);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={[
        'group flex min-w-0 items-center gap-4',
        'rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3',
        'hover:bg-white/[0.05] transition',
        className,
      ].join(' ')}
      title={`Open ${h} on X`}
    >
      {/* AVATAR */}
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name ? `${name} avatar` : `${h} avatar`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_60%)]" />
        )}
      </div>

      {/* TEXT */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[18px] font-semibold tracking-tight text-white">
            {name?.trim() ? name : h.replace(/^@/, '')}
          </span>

          {verified ? <XVerifiedBadge /> : null}

          {showExternalIcon ? (
            <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition" />
          ) : null}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-3">
          <span className="truncate text-[14px] text-slate-400">{h}</span>

          {subtitle ? (
            <span className="text-[12px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}
