'use client';

import { useState } from 'react';

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

const now = new Date();
const initialEntries: Entry[] = [
  {
    id: 1,
    code: makeCode(),
    status: 'won',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 2,
    code: makeCode(),
    status: 'in-draw',
    label: "Yesterday's main jackpot • $8,400",
    jackpotUsd: '$8,400',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function ClaimTicketSection() {
  // 🔒 Auth temporarily disabled – treat everyone as anonymous
  const isAuthed = false;
  const loading = false;

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const winner = entries.find(e => e.status === 'won');

  function handleClaimTicket() {
    if (!isAuthed) {
      // For now, just block and show message via UI text
      return;
    }

    if (ticketClaimed) return;

    const newEntry: Entry = {
      id: Date.now(),
      code: makeCode(),
      status: 'in-draw',
      label: "Today's main jackpot • $10,000",
      jackpotUsd: '$10,000',
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setEntries(prev => [newEntry, ...prev]);
    setTicketClaimed(true);
    setTodaysTicket(newEntry);
  }

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }
