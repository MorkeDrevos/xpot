'use client';

// components/ClaimTicketSection.tsx
import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type ClaimTicketSectionProps = {
  className?: string;

  // Optional hooks your older code might pass (safe to ignore if unused)
  onClaim?: (code: string) => Promise<void> | void;
  onLookup?: (code: string) => Promise<EntryStatus | null> | EntryStatus | null;
};

export default function ClaimTicketSection({
  className = '',
  onClaim,
  onLookup,
}: ClaimTicketSectionProps) {
  const { connected } = useWallet();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<EntryStatus | null>(null);
  const [msg, setMsg] = useState<string>('');

  const canSubmit = useMemo(() => {
    const c = code.trim();
    return c.length >= 6 && c.length <= 64;
  }, [code]);

  async function handleLookup() {
    if (!canSubmit) return;
    setBusy(true);
    setMsg('');
    try {
      if (!onLookup) {
        setStatus(null);
        setMsg('Lookup temporarily unavailable.');
        return;
      }
      const s = await onLookup(code.trim());
      setStatus(s ?? null);
      setMsg(s ? `Status: ${s}` : 'No ticket found.');
    } catch (e: any) {
      setStatus(null);
      setMsg(e?.message || 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    if (!canSubmit) return;
    if (!connected) {
      setMsg('Connect your wallet first.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      if (!onClaim) {
        setMsg('Claim temporarily disabled.');
        return;
      }
      await onClaim(code.trim());
      setStatus('claimed');
      setMsg('Claim submitted.');
    } catch (e: any) {
      setMsg(e?.message || 'Claim failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={[
        'rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm backdrop-blur',
        className,
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Claim ticket</h3>
          <p className="text-sm text-slate-400">
            Enter your ticket code to check status (claim flow will be re-enabled after restore).
          </p>
        </div>

        <div className="shrink-0">
          <WalletMultiButton />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ticket code"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/20"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLookup}
            disabled={busy || !canSubmit}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? '…' : 'Check'}
          </button>

          <button
            type="button"
            onClick={handleClaim}
            disabled={busy || !canSubmit || !connected}
            className="rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 px-4 py-3 text-sm font-semibold text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? '…' : 'Claim'}
          </button>
        </div>
      </div>

      {(msg || status) && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
          {msg || (status ? `Status: ${status}` : '')}
        </div>
      )}
    </section>
  );
}
