// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={160}
            height={40}
            priority
          />
        </div>

        <p className="text-sm text-slate-400">
          One protocol. One identity. One daily XPOT draw.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-50 px-5 py-2 text-sm font-semibold text-black hover:bg-slate-200"
          >
            Open dashboard
          </Link>

          <Link
            href="/what-is-xpot"
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:border-slate-500 hover:bg-slate-900"
          >
            Learn more
          </Link>
        </div>

        <p className="text-[11px] text-slate-500">
          To join today&apos;s XPOT draw, continue to the dashboard and sign in
          with X from there.
        </p>
      </div>
    </main>
  );
}
