// app/final-day/page.tsx (or wherever you mount it)
// FinalDayPage.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Crown,
  ExternalLink,
  Flame,
  Gift,
  Info,
  Lock,
  Sparkles,
  Star,
  ShieldCheck,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';

const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';

type FinalDayPageProps = {
  // Optional: wire real values later (DB-driven)
  dayIndex?: number; // e.g. 6991
  dailyAmount?: number; // 1_000_000
  finalTimestampIso?: string; // e.g. "2045-06-...T00:00:00Z"
};

export default function FinalDayPage(_props: FinalDayPageProps) {
  const reduceMotion = useReducedMotion();

  // --- purely visual “futuristic” ambience state ---
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setInterval(() => setPulse((p) => (p + 1) % 1000), 900);
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  // --- layout helpers ---
  const container =
    'mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8';

  return (
    <XpotPageShell
      title={undefined}
      subtitle={undefined}
      showTopBar
      className="relative overflow-hidden"
      containerClassName="pb-0"
    >
      {/* FULL-BLEED: totally new “future archive” backdrop */}
      <FutureBackdrop pulse={pulse} />

      <main className="relative">
        {/* 0) Page Top Spacer (keeps topbar breathing room) */}
        <div className="h-4 sm:h-6" />

        {/* 1) HERO: The Last Day (cinematic, nothing like existing pages) */}
        <section className={`${container}`}>
          <TimeHeader />
          <FinalDayHero />
        </section>

        {/* 2) SIGNAL STRIP: “System status” + “Final draw integrity” */}
        <section className={`${container} mt-10 sm:mt-12`}>
          <SignalStrip />
        </section>

        {/* 3) MAIN GRID: left = story modules, right = “last draw” monolith */}
        <section className={`${container} mt-10 sm:mt-12`}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <MemoryCapsuleCard />
              <LegacyTimeline />
              <FinalEulogyCard />
              <GuardianRulesCard />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <LastDrawMonolith />
              <HallOfFamePortal />
              <TimeLockPlaque />
            </div>
          </div>
        </section>

        {/* 4) FULL-BLEED: “Eclipse Moment” divider */}
        <section className="relative mt-14 sm:mt-16">
          <EclipseDivider />
        </section>

        {/* 5) EPILOGUE: the end screen + links */}
        <section className={`${container} mt-12 sm:mt-14 pb-12 sm:pb-16`}>
          <EpilogueGrid />
        </section>
      </main>

      {/* Local page-only styling (so it cannot look like other pages) */}
      <style jsx global>{`
        .xpot-finalday-noise {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(56,189,248,0.08), transparent 46%),
            radial-gradient(circle at 72% 30%, rgba(244,63,94,0.10), transparent 44%),
            radial-gradient(circle at 40% 78%, rgba(16,185,129,0.09), transparent 50%);
          filter: saturate(1.08);
        }
        .xpot-finalday-grid {
          background-image:
            linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at 50% 30%, black 42%, transparent 72%);
        }
        .xpot-finalday-scan {
          position: absolute;
          inset: -40% -20%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255,255,255,0.05),
            rgba(56,189,248,0.06),
            transparent
          );
          transform: rotate(8deg);
          animation: xpotFinalScan 9.5s ease-in-out infinite;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.6;
        }
        @keyframes xpotFinalScan {
          0% { transform: translate3d(-6%, -2%, 0) rotate(8deg); opacity: 0.25; }
          45% { opacity: 0.75; }
          100% { transform: translate3d(6%, 2%, 0) rotate(8deg); opacity: 0.25; }
        }
      `}</style>
    </XpotPageShell>
  );
}

/* ----------------------------- Subcomponents ----------------------------- */

function FutureBackdrop({ pulse }: { pulse: number }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 xpot-finalday-noise" />
      <div className="absolute inset-0 xpot-finalday-grid opacity-70" />
      <div className="xpot-finalday-scan" />
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 50% 15%, rgba(255,255,255,0.08), transparent 55%),
             radial-gradient(circle at 18% 60%, rgba(16,185,129,0.09), transparent 50%),
             radial-gradient(circle at 82% 55%, rgba(56,189,248,0.08), transparent 55%)`,
          opacity: 0.9,
        }}
      />
      {/* tiny pulse to make it “alive” without copying existing vibe */}
      <div
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06), transparent 48%)`,
          opacity: 0.08 + (pulse % 6) * 0.01,
        }}
      />
    </div>
  );
}

function TimeHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={ROUTE_HUB}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/8 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Hub
      </Link>

      <Link
        href={ROUTE_TERMS}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/8 transition"
      >
        <Info className="h-4 w-4" />
        Terms
      </Link>
    </div>
  );
}

function FinalDayHero() {
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-white/7 to-white/3 p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[720px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/70">
            <Clock className="h-4 w-4 text-white/70" />
            <span>FINAL DAY - ARCHIVE MODE</span>
            <span className="mx-1 text-white/25">•</span>
            <span className="text-white/60">Year +19.18</span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            {/* YOU will write final copy */}
            The Last Main Daily XPOT
          </h1>

          <p className="mt-3 text-base sm:text-lg text-white/72 leading-relaxed">
            {/* YOU will write final copy */}
            {/* This page is a time capsule. It feels like the end of an era - not a normal landing page. */}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <HeroButtonPrimary />
            <HeroButtonSecondary />
          </div>
        </div>

        <HeroSigil />
      </div>
    </div>
  );
}

function HeroButtonPrimary() {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-5 py-3 font-semibold shadow hover:brightness-105 transition"
    >
      Enter the Final Draw
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function HeroButtonSecondary() {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 font-semibold text-white/85 hover:bg-white/8 transition"
    >
      View the Archive
      <ExternalLink className="h-4 w-4" />
    </button>
  );
}

function HeroSigil() {
  return (
    <div className="relative shrink-0 rounded-[24px] border border-white/10 bg-black/35 p-5 sm:p-6 w-full lg:w-[320px]">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">SIGNATURE</div>
        <div className="inline-flex items-center gap-2 text-xs text-white/55">
          <Star className="h-4 w-4" />
          <span>Immutable</span>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-gradient-to-b from-white/6 to-transparent p-4">
        <div className="text-xs text-white/50">FINAL-DAY HASH</div>
        <div className="mt-2 font-mono text-xs text-white/70 break-all">
          {/* placeholder */}
          0xFINALDAY::XPOT::ARCHIVE::6991::…
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
          <ShieldCheck className="h-4 w-4 text-emerald-300/80" />
          <span>Integrity verified</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
        <Lock className="h-4 w-4" />
        <span>Read-only after closure</span>
      </div>
    </div>
  );
}

function SignalStrip() {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/35 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SignalPill icon={<Flame className="h-4 w-4" />} label="Last ignition" value="ACTIVE" />
        <SignalPill icon={<Gift className="h-4 w-4" />} label="Final pool" value="1,000,000 XPOT" />
        <SignalPill icon={<Sparkles className="h-4 w-4" />} label="Audience" value="Global" />
      </div>
    </div>
  );
}

function SignalPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-white/70">
        <span className="text-white/70">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function MemoryCapsuleCard() {
  return (
    <CardShell title="Memory Capsule" icon={<Sparkles className="h-4 w-4" />}>
      {/* YOU will write final copy */}
      <p className="text-white/72 leading-relaxed">
        {/* placeholder */}
      </p>
    </CardShell>
  );
}

function LegacyTimeline() {
  return (
    <CardShell title="Timeline of a Game That Outlived Time" icon={<Clock className="h-4 w-4" />}>
      <div className="space-y-3">
        <TimelineRow k="Year 0" v="Launch signal" />
        <TimelineRow k="Year 3" v="First global wave" />
        <TimelineRow k="Year 7" v="Cultural takeover" />
        <TimelineRow k="Year 12" v="The world plays" />
        <TimelineRow k="Year 19.18" v="Final daily main draw" />
      </div>
    </CardShell>
  );
}

function TimelineRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm font-semibold text-white">{k}</div>
      <div className="text-sm text-white/70 text-right">{v}</div>
    </div>
  );
}

function FinalEulogyCard() {
  return (
    <CardShell title="The Final Day" icon={<Crown className="h-4 w-4" />}>
      {/* YOU will write final copy */}
      <div className="rounded-[16px] border border-white/10 bg-black/35 p-4">
        <p className="text-white/75 leading-relaxed">
          {/* placeholder */}
        </p>
        <div className="mt-4 text-xs text-white/45">
          {/* placeholder */}
          Archived permanently - timestamped - uneditable.
        </div>
      </div>
    </CardShell>
  );
}

function GuardianRulesCard() {
  return (
    <CardShell title="Final-Day Rules" icon={<ShieldCheck className="h-4 w-4" />}>
      <ul className="space-y-2 text-sm text-white/72">
        <li className="flex gap-2">
          <span className="text-white/35">•</span>
          {/* YOU will write */}
          <span>Rule line 1…</span>
        </li>
        <li className="flex gap-2">
          <span className="text-white/35">•</span>
          <span>Rule line 2…</span>
        </li>
        <li className="flex gap-2">
          <span className="text-white/35">•</span>
          <span>Rule line 3…</span>
        </li>
      </ul>
    </CardShell>
  );
}

function LastDrawMonolith() {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/12 bg-gradient-to-b from-white/10 to-black/40 p-5 sm:p-6 shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-white/60">THE LAST DRAW</div>
        <div className={`text-xs ${GOLD_TEXT}`}>FINAL EDITION</div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-black/35 p-4">
        <div className="text-xs text-white/50">POOL</div>
        <div className="mt-1 text-2xl font-semibold text-white">1,000,000 XPOT</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Day index" value="#6991" />
          <MiniStat label="Status" value="Live" />
          <MiniStat label="Mode" value="Final" />
          <MiniStat label="Write access" value="Closed" />
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded-full bg-white text-black px-5 py-3 font-semibold hover:brightness-105 transition"
        >
          Enter Now
        </button>

        <button
          type="button"
          className="mt-3 w-full rounded-full border border-white/12 bg-white/5 px-5 py-3 font-semibold text-white/85 hover:bg-white/8 transition"
        >
          Watch the Last Moment
        </button>
      </div>

      <div className="mt-4 text-xs text-white/45 leading-relaxed">
        {/* YOU will write */}
        This monolith stays on-chain as the last public interface of the daily main.
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] text-white/55">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function HallOfFamePortal() {
  return (
    <CardShell title="Hall of Fame" icon={<Crown className="h-4 w-4" />}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 font-semibold text-white/85 hover:bg-white/8 transition"
        >
          Open Winners Archive
          <ExternalLink className="h-4 w-4" />
        </button>

        <div className="text-xs text-white/45">
          {/* YOU will write */}
          Handle-based legacy preserved forever.
        </div>
      </div>
    </CardShell>
  );
}

function TimeLockPlaque() {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/35 p-5">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Lock className="h-4 w-4" />
        <span>Time-Lock Plaque</span>
      </div>
      <div className="mt-3 rounded-[16px] border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/50">FINAL MESSAGE</div>
        <p className="mt-2 text-sm text-white/75 leading-relaxed">
          {/* YOU will write */}
        </p>
      </div>
    </div>
  );
}

function EclipseDivider() {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/8 to-black/30 p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <div className="text-xs text-white/55">ECLIPSE MOMENT</div>
              <div className="mt-2 text-xl sm:text-2xl font-semibold text-white">
                {/* YOU will write */}
                When the lights go out, the legend remains.
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-xs text-white/60">
              <Flame className="h-4 w-4" />
              <span>Archive sealed</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function EpilogueGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <CardShell title="Epilogue" icon={<Sparkles className="h-4 w-4" />}>
          {/* YOU will write final copy */}
          <p className="text-white/72 leading-relaxed">{/* placeholder */}</p>
        </CardShell>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <CardShell title="Links" icon={<ExternalLink className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <Link
              href={ROUTE_HUB}
              className="inline-flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/8 transition"
            >
              Hub <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTE_TERMS}
              className="inline-flex items-center justify-between rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/8 transition"
            >
              Terms <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardShell>

        <div className={`rounded-[22px] border ${GOLD_BORDER} ${GOLD_BG_WASH} p-5`}>
          <div className={`text-sm font-semibold ${GOLD_TEXT}`}>The Final Seal</div>
          <div className="mt-2 text-xs text-white/60">
            {/* YOU will write */}
            Signed, timestamped, and left for the next civilisation.
          </div>
        </div>
      </div>
    </div>
  );
}

function CardShell({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/35 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span className="text-white/70">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
