'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Entry = {
  id?: string;
  handle: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export default function LiveActivityModule() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch('/api/public/entries/latest?limit=24', {
          cache: 'no-store',
        });

        if (!res.ok) {
          if (alive) setEntries([]);
          return;
        }

        const json = await res.json();
        const raw = Array.isArray(json?.entries) ? json.entries : [];

        const seen = new Set<string>();
        const mapped: Entry[] = [];

        for (const r of raw) {
          const h = String(r?.handle || '').trim();
          if (!h) continue;

          const handle = h.startsWith('@') ? h : `@${h}`;
          const key = handle.toLowerCase();
          if (seen.has(key)) continue;

          seen.add(key);
          mapped.push({
            id: r?.id,
            handle,
            name: r?.name ?? null,
            avatarUrl: r?.avatarUrl ?? null,
          });
        }

        if (alive) setEntries(mapped);
      } catch {
        if (alive) setEntries([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 25_000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 text-xs uppercase tracking-widest text-slate-400">
        Entries
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Updating…</div>
      ) : entries.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">
            Claim in the hub to appear here.
          </span>
          <Link
            href="/hub"
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-white"
          >
            Claim
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {entries.slice(0, 12).map((e) => {
            const clean = e.handle.replace('@', '');
            const img =
              e.avatarUrl ||
              `https://unavatar.io/twitter/${encodeURIComponent(clean)}`;

            return (
              <a
                key={e.id || e.handle}
                href={`https://x.com/${clean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 overflow-hidden rounded-full border border-white/10"
                title={e.handle}
              >
                <img
                  src={img}
                  alt={e.handle}
                  className="h-full w-full object-cover"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
