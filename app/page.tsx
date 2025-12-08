// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-slate-50">
      {/* Hero wrapper */}
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 pt-28 pb-24 text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={168}
            height={40}
            priority
          />
        </div>

        {/* Tagline */}
        <p className="text-sm text-slate-400">
          One protocol. One identity. One daily XPOT draw.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 hover:bg-slate-100"
          >
            Open dashboard
          </Link>

          <Link
            href="/what-is-xpot"
            className="inline-flex items-center rounded-full border border-slate-600 px-6 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 hover:bg-slate-900"
          >
            Learn more
          </Link>
        </div>

        {/* Tiny note */}
        <p className="mt-8 text-[11px] text-slate-500">
          To join today’s XPOT draw, continue to the dashboard and sign in with X from there.
        </p>
      </div>
    </main>
  );
}
