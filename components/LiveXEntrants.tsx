'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

type LiveEntrant = {
  handle: string
  avatarUrl: string
  verified?: boolean
}

export default function LiveXEntrants({
  entrants,
}: {
  entrants: LiveEntrant[]
}) {
  return (
    <section className="relative rounded-[32px] border border-white/10 bg-gradient-to-br from-black/60 via-black/40 to-black/60 p-8 shadow-[0_0_120px_rgba(16,185,129,0.06)] backdrop-blur-xl">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
          <h3 className="text-sm font-semibold tracking-[0.32em] text-emerald-300">
            LIVE ENTRANTS
          </h3>
        </div>
        <span className="text-xs text-white/40">
          X identities · self-custody
        </span>
      </div>

      {/* Entrants */}
      <div className="flex flex-wrap gap-5">
        {entrants.map((e, i) => (
          <motion.div
            key={e.handle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative"
          >
            {/* Halo */}
            <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl opacity-0 transition group-hover:opacity-100" />

            {/* Capsule */}
            <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              
              {/* Avatar */}
              <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/20">
                <Image
                  src={e.avatarUrl}
                  alt={e.handle}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Handle */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium tracking-wide text-white/90">
                  @{e.handle}
                </span>
                {e.verified && (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer whisper */}
      <p className="mt-6 text-xs text-white/30">
        Wallets never exposed. Identity stays yours.
      </p>
    </section>
  )
}
