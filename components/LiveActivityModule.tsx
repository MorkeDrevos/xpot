// components/LiveActivityModule.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, List as ListIcon, Users } from 'lucide-react';

export type EntryRow = {
  id?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  verified?: boolean | null;
};

function normalizeHandle(h: any) {
  const s = String(h ?? '').trim();
  if (!s) return '';
  return s.startsWith('@') ? s : `@${s}`;
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
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
  const clean = handle.replace(/^@/, '');
  // cache-buster changes only every 6h, so it won't cause render jitter
  const bucket = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  return avatarUrl ?? `https://unavatar.io/twitter/${encodeURIComponent(clean)}?cache=${bucket}`;
}

function initialsFor(e: EntryRow) {
  const src = (e.name && String(e.name).trim()) || e.handle.replace(/^@/, '');
  const parts = src.split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] ?? '').toUpperCase();
  const b = (parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1]) ?? '';
  const out = `${a}${String(b).toUpperCase()}`.trim();
  return out || '?';
}

function AvatarBubble({ e, size }: { e: EntryRow; size: number }) {
  const clean = e.handle.replace(/^@/, '');
  const img = avatarUrlFor(e.handle, e.avatarUrl);

  return (
    <a
      href={`https://x.com/${encodeURIComponent(clean)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative"
      title={e.handle}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-full opacity-0 blur-xl transition group-hover:opacity-100
                   bg-[radial-gradient(circle_at_40%_40%,rgba(56,189,248,0.20),transparent_62%),
                       radial-gradient(circle_at_60%_55%,rgba(255,215,97,0.16),transparent_60%)]"
      />
      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full
                   border border-white/10 bg-white/[0.03]
                   shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={e.handle}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </span>
    </a>
  );
}

function ListAvatar({ e }: { e: EntryRow }) {
  const img = avatarUrlFor(e.handle, e.avatarUrl);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="
          inline-flex h-9 w-9 items-center justify-center
          rounded-full border border-white/10 bg-white/[0.03]
          text-[12px] font-semibold text-slate-200
        "
        aria-label={`${e.handle} avatar`}
      >
        {initialsFor(e)}
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex h-9 w-9 items-center justify-center overflow-hidden
        rounded-full border border-white/10 bg-white/[0.03]
      "
      aria-label={`${e.handle} avatar`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={e.handle}
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function EntryRowLine({ e }: { e: EntryRow }) {
  const clean = e.handle.replace(/^@/, '');

  return (
    <a
      href={`https://x.com/${encodeURIComponent(clean)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group flex items-center gap-3
        rounded-2xl border border-white/10 bg-white/[0.02]
        px-4 py-3
        hover:bg-white/[0.035]
        transition
      "
      title={e.handle}
    >
      <ListAvatar e={e} />

      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-slate-100">
          {e.name || clean}
        </div>
        <div className="truncate text-[12px] text-slate-400">{e.handle}</div>
      </div>

      <span className="ml-auto text-[12px] text-slate-500 group-hover:text-slate-300 transition">
        View
      </span>
    </a>
  );
}

export default function LiveActivityModule() {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [mode, setMode] = useState<'bubbles' | 'list'>('bubbles');

  // Important: separate "first load" from "refreshing" to stop UI flashing
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

      // Only show the big loading state before we have any data.
      if (!hasLoadedOnceRef.current) setInitialLoading(true);
      else setRefreshing(true);

      try {
        abortRef.current?.abort();
      } catch {}
      abortRef.current = new AbortController();

      try {
        const res = await fetch('/api/public/entries/latest?limit=24', {
          cache: 'no-store',
          signal: abortRef.current.signal,
        });

        // If this env somehow doesn't have the route, stop retry spam.
        if (res.status === 404) {
          if (alive) {
            setDisabled(true);
            // keep whatever we already had, but stop polling
          }
          return;
        }

        if (!res.ok) {
          // DO NOT clear rows here (prevents flashing)
          return;
        }

        const json: any = await res.json();
        const raw = Array.isArray(json?.entries) ? json.entries : [];

        const mapped: EntryRow[] = raw
          .map((r: any) => {
            const handle = normalizeHandle(r?.handle);
            if (!handle) return null;
            return {
              id: r?.id ?? undefined,
              handle,
              name: r?.name ?? null,
              avatarUrl: r?.avatarUrl ?? null,
              createdAt: r?.createdAt ?? null,
              verified: r?.verified ?? null,
            } as EntryRow;
          })
          .filter(Boolean);

        const deduped = dedupeByHandleKeepLatest(mapped);

        if (alive) {
          setRows(deduped);
          hasLoadedOnceRef.current = true;
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        // DO NOT clear rows on errors (prevents flicker)
      } finally {
        if (!alive) return;
        setInitialLoading(false);
        setRefreshing(false);
      }
    }

    load();
    const t = window.setInterval(load, 25_000);

    return () => {
      alive = false;
      window.clearInterval(t);
      try {
        abortRef.current?.abort();
      } catch {}
    };
  }, [disabled]);

  const uniqCount = rows.length;

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
              mode === 'bubbles'
                ? 'bg-white/[0.07] text-slate-100'
                : 'text-slate-400 hover:text-slate-200',
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
              mode === 'list'
                ? 'bg-white/[0.07] text-slate-100'
                : 'text-slate-400 hover:text-slate-200',
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
            <AvatarBubble key={(e.id ?? e.handle).toString()} e={e} size={size} />
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
          <div className="pt-1 text-[12px] text-slate-500">
            Claim in the hub to join today’s list.
          </div>
        </div>
      )}
    </div>
  );
}
