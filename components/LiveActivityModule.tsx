// components/LiveActivityModule.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Crown, LayoutGrid, List as ListIcon, Users } from 'lucide-react';

export type EntryRow = {
  id?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  verified?: boolean | null;
};

type LiveActivityModuleProps = {
  /**
   * Optional: if you want to mark a specific handle as "winner" in the bubbles hover card
   * (for example: pass latestWinner.handle from Stage).
   *
   * If you do NOT pass this, XPOT badge won't show (still shows verified if present).
   */
  winnerHandle?: string | null;

  /**
   * Optional: override polling interval (ms)
   */
  pollMs?: number;

  /**
   * Optional: override limit
   */
  limit?: number;
};

function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return '';
  const core = s.replace(/^@+/, '');
  return core ? `@${core}` : '';
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function cleanFromHandle(handle: string) {
  return normalizeHandle(handle).replace(/^@/, '');
}

function normalizeDisplayName(name: any, handle: string) {
  const raw = String(name ?? '').trim();
  if (!raw) return null;

  const clean = cleanFromHandle(handle).toLowerCase();
  const rawLower = raw.toLowerCase();

  // If backend accidentally sends username as "name", do not show it as a display name
  if (rawLower === clean) return null;
  if (rawLower === `@${clean}`) return null;

  return raw;
}

function pickFirstString(...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

function pickFirstNullableString(...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return null;
}

function pickFirstBool(...vals: any[]) {
  for (const v of vals) {
    if (typeof v === 'boolean') return v;
  }
  return null;
}

function dedupeByHandleKeepLatest(rows: EntryRow[]) {
  const map = new Map<string, EntryRow>();

  for (const r of rows ?? []) {
    const handle = normalizeHandle(r?.handle);
    if (!handle) continue;

    const key = handle.toLowerCase();
    const cur = map.get(key);

    const ts = safeTimeMs(r?.createdAt ?? null);
    const curTs = cur ? safeTimeMs(cur.createdAt ?? null) : -1;

    if (!cur || ts >= curTs) {
      map.set(key, {
        ...r,
        handle,
        name: r?.name ? String(r.name).trim() : r?.name ?? null,
        createdAt: r?.createdAt ?? null,
        avatarUrl: r?.avatarUrl ?? null,
        verified: r?.verified ?? null,
      });
    }
  }

  const out = Array.from(map.values());
  out.sort((a, b) => safeTimeMs(b.createdAt ?? null) - safeTimeMs(a.createdAt ?? null));
  return out;
}

function avatarUrlFor(handle: string, avatarUrl?: string | null) {
  const clean = normalizeHandle(handle).replace(/^@/, '');
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000)); // 6h bucket
  return avatarUrl ?? `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${bucket}`;
}

function initialsFor(handle: string) {
  const clean = normalizeHandle(handle).replace(/^@/, '').trim();
  return (clean || 'x').slice(0, 1).toUpperCase();
}

function isSameHandle(a?: string | null, b?: string | null) {
  const aa = normalizeHandle(a).toLowerCase();
  const bb = normalizeHandle(b).toLowerCase();
  if (!aa || !bb) return false;
  return aa === bb;
}

function AvatarTile({
  handle,
  avatarUrl,
  sizeClass,
  roundedClass,
  borderClass,
  bgClass,
  imgClass,
}: {
  handle: string;
  avatarUrl?: string | null;
  sizeClass: string;
  roundedClass: string;
  borderClass: string;
  bgClass: string;
  imgClass: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => avatarUrlFor(handle, avatarUrl), [handle, avatarUrl]);

  return (
    <span
      className={[
        'relative inline-flex items-center justify-center overflow-hidden',
        roundedClass,
        borderClass,
        bgClass,
        sizeClass,
      ].join(' ')}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={handle}
          className={imgClass}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-200">{initialsFor(handle)}</span>
      )}
    </span>
  );
}

function AvatarBubble({
  row,
  size = 56,
  isWinner,
}: {
  row: EntryRow;
  size?: number;
  isWinner?: boolean;
}) {
  const handle = normalizeHandle(row.handle);
  const clean = handle.replace(/^@/, '');
  const img = useMemo(() => avatarUrlFor(handle, row.avatarUrl), [handle, row.avatarUrl]);

  return (
    <a
      href={`https://x.com/${encodeURIComponent(clean)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative"
      title={handle}
    >
      {/* Hover card (desktop) */}
      <div
        className="
          pointer-events-none
          absolute bottom-full left-1/2 z-30
          hidden -translate-x-1/2 pb-3
          lg:block
          opacity-0 translate-y-1 scale-[0.98]
          transition duration-150 ease-out
          delay-150
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
        "
      >
        <div
          className="
            relative w-56
            rounded-2xl border border-white/10
            bg-slate-950/95
            px-3.5 py-3
            shadow-[0_26px_80px_rgba(0,0,0,0.70)]
            backdrop-blur
          "
        >
          {/* Soft caret */}
          <div
            aria-hidden
            className="
              absolute left-1/2 top-full
              -translate-x-1/2
              h-3 w-3 rotate-45
              border border-white/10
              bg-slate-950/95
              shadow-[0_14px_40px_rgba(0,0,0,0.55)]
            "
          />

          <div className="flex items-center gap-3">
            <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={handle}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />

              {/* Verified badge */}
              {row.verified ? (
                <span
                  className="
                    absolute -bottom-1 -right-1
                    inline-flex h-5 w-5 items-center justify-center
                    rounded-full border border-white/10
                    bg-sky-500/20
                    ring-1 ring-sky-400/20
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    backdrop-blur
                  "
                  title="Verified"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" />
                </span>
              ) : null}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[13px] font-semibold text-slate-100">
                  {row.name || clean || 'Unknown'}
                </div>

                {/* XPOT badge for winners */}
                {isWinner ? (
                  <span
                    className="
                      inline-flex items-center gap-1
                      rounded-full
                      border border-amber-300/20
                      bg-amber-500/10
                      px-2 py-0.5
                      text-[10px] font-semibold
                      text-amber-200
                      shadow-[0_0_0_1px_rgba(251,191,36,0.10)]
                    "
                    title="Winner"
                  >
                    <Crown className="h-3 w-3" />
                    XPOT
                  </span>
                ) : null}
              </div>

              <div className="truncate text-[12px] text-slate-400">{handle || '@unknown'}</div>
              <div className="mt-1 text-[11px] text-slate-500">View on X →</div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow */}
      <span className="pointer-events-none absolute -inset-2 rounded-full opacity-0 blur-xl transition group-hover:opacity-100 bg-[radial-gradient(circle_at_40%_40%,rgba(56,189,248,0.22),transparent_62%),radial-gradient(circle_at_60%_55%,rgba(var(--xpot-gold),0.18),transparent_60%)]" />

      {/* Avatar */}
      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={handle} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      </span>
    </a>
  );
}

function EntryRowLine({ e }: { e: EntryRow }) {
  const h = normalizeHandle(e.handle);
  const clean = h.replace(/^@/, '');

  return (
    <a
      href={`https://x.com/${encodeURIComponent(clean)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition"
      title={h}
    >
      <AvatarTile
        handle={h}
        avatarUrl={e.avatarUrl}
        sizeClass="h-10 w-10"
        roundedClass="rounded-xl"
        borderClass="border border-white/10"
        bgClass="bg-white/[0.03]"
        imgClass="h-full w-full object-cover"
      />

      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-slate-100">{e.name || clean}</div>
        <div className="truncate text-[12px] text-slate-400">{h}</div>
      </div>

      <span className="ml-auto text-[12px] text-slate-500 group-hover:text-slate-300 transition">View</span>
    </a>
  );
}

export default function LiveActivityModule({
  winnerHandle = null,
  pollMs = 25_000,
  limit = 24,
}: LiveActivityModuleProps) {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [mode, setMode] = useState<'bubbles' | 'list'>('bubbles');

  // separate "first load" from "refreshing" to stop UI flashing
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (disabled) return;

    let alive = true;

    async function load() {
      if (!alive || disabled) return;

      if (!hasLoadedOnceRef.current) setInitialLoading(true);
      else setRefreshing(true);

      try {
        abortRef.current?.abort();
      } catch {}
      abortRef.current = new AbortController();

      try {
        const res = await fetch(`/api/public/entries/latest?limit=${encodeURIComponent(String(limit))}`, {
          cache: 'no-store',
          signal: abortRef.current.signal,
        });

        if (res.status === 404) {
          if (alive) setDisabled(true);
          return;
        }

        if (!res.ok) {
          // never clear rows (prevents flicker)
          return;
        }

        const json: any = await res.json();
        const raw = Array.isArray(json?.entries) ? json.entries : [];

        const mapped: EntryRow[] = raw
          .map((r: any) => {
            // Handles can be named differently depending on endpoint version
            const handle = normalizeHandle(
              pickFirstString(
                r?.handle,
                r?.xHandle,
                r?.x_handle,
                r?.username,
                r?.screenName,
                r?.screen_name,
                r?.user?.handle,
                r?.user?.xHandle,
                r?.user?.username
              )
            );
            if (!handle) return null;

            // Display name also varies a lot across payloads
            const nameCandidate = pickFirstNullableString(
              r?.name,
              r?.displayName,
              r?.display_name,
              r?.fullName,
              r?.full_name,
              r?.xName,
              r?.x_name,
              r?.profileName,
              r?.profile_name,
              r?.user?.name,
              r?.user?.displayName,
              r?.user?.display_name,
              r?.user?.fullName,
              r?.user?.xName
            );

            const avatarCandidate = pickFirstNullableString(
              r?.avatarUrl,
              r?.avatar_url,
              r?.profileImageUrl,
              r?.profile_image_url,
              r?.imageUrl,
              r?.image_url,
              r?.user?.avatarUrl,
              r?.user?.avatar_url,
              r?.user?.profileImageUrl,
              r?.user?.profile_image_url
            );

            const verifiedCandidate = pickFirstBool(
              r?.verified,
              r?.isVerified,
              r?.is_verified,
              r?.user?.verified,
              r?.user?.isVerified,
              r?.user?.is_verified
            );

            return {
              id: r?.id ?? undefined,
              handle,
              name: normalizeDisplayName(nameCandidate, handle),
              avatarUrl: avatarCandidate,
              createdAt: r?.createdAt ?? r?.created_at ?? r?.ts ?? r?.time ?? null,
              verified: verifiedCandidate,
            } as EntryRow;
          })
          .filter(Boolean) as EntryRow[];

        const deduped = dedupeByHandleKeepLatest(mapped);

        if (alive) {
          setRows(deduped);
          hasLoadedOnceRef.current = true;
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      } finally {
        if (!alive) return;
        setInitialLoading(false);
        setRefreshing(false);
      }
    }

    load();
    const t = window.setInterval(load, pollMs);

    return () => {
      alive = false;
      window.clearInterval(t);
      try {
        abortRef.current?.abort();
      } catch {}
    };
  }, [disabled, pollMs, limit]);

  const uniqCount = useMemo(() => {
    const s = new Set(rows.map(r => normalizeHandle(r.handle).toLowerCase()).filter(Boolean));
    return s.size;
  }, [rows]);

  const bubbles = useMemo(() => {
    return rows.slice(0, 12).map((e, idx) => ({
      e,
      size: idx === 0 ? 56 : idx < 4 ? 48 : 40,
    }));
  }, [rows]);

  const showEmpty = !initialLoading && rows.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <Users className="h-3.5 w-3.5" />
            Entries
          </div>
          <div className="mt-1 text-[12px] text-slate-400">
            {initialLoading ? 'Updating…' : `${uniqCount} unique entrants`}
            {refreshing ? <span className="ml-2 text-slate-500">refreshing</span> : null}
          </div>
        </div>

        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode('bubbles')}
            className={[
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
              mode === 'bubbles' ? 'bg-white/[0.07] text-slate-100' : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
            title="Bubbles"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Bubbles
          </button>

          <button
            type="button"
            onClick={() => setMode('list')}
            className={[
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
              mode === 'list' ? 'bg-white/[0.07] text-slate-100' : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
            title="List"
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {showEmpty ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-slate-400">Claim in the hub to appear here.</span>
          <Link
            href="/hub"
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
          >
            Claim in hub →
          </Link>
        </div>
      ) : mode === 'bubbles' ? (
        <div className="flex flex-wrap items-center gap-3 py-1">
          {bubbles.map(({ e, size }) => (
            <AvatarBubble
              key={(e.id ?? e.handle).toString()}
              row={e}
              size={size}
              isWinner={isSameHandle(e.handle, winnerHandle)}
            />
          ))}
          <div className="ml-auto text-[12px] text-slate-400">
            <span className="text-slate-200">{uniqCount}</span> today
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 10).map(e => (
            <EntryRowLine key={(e.id ?? e.handle).toString()} e={e} />
          ))}
          <div className="pt-1 text-[12px] text-slate-500">Claim in the hub to join today’s list.</div>
        </div>
      )}
    </div>
  );
}
