'use client'

import { ReactNode, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export default function XpotAccessGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      const params = new URLSearchParams({ redirect_url: '/dashboard' })
      window.location.href = `/sign-in?${params.toString()}`
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 px-6 py-5 text-center">
          <p className="text-sm font-semibold">Redirecting to X login…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
