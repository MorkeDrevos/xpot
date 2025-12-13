// app/page.tsx
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-semibold">XPOT</h1>
      <p className="mt-2 text-slate-400">
        Temporary recovery homepage. Components will be restored after green build.
      </p>
    </main>
  );
}
