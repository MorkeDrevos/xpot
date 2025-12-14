// app/api/admin/dev-seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUtc(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return todayUtcStart(d);
}

function makeTicketCode() {
  // unique enough for dev seeding; includes time + randomness
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `XPOT-${t}-${r}`;
}

type SeedBody = {
  days?: number;              // how many draws to seed starting today (default 1)
  wallets?: number;           // how many unique wallets (default 30)
  minTickets?: number;        // per draw total tickets (default 40)
  maxTickets?: number;        // per draw total tickets (default 160)
  clearDrawTickets?: boolean; // delete tickets for seeded draws first (default true)
  seedWinners?: boolean;      // create a few winners (default true)
  seedBonusDrops?: boolean;   // create a few bonus drops (default true)
};

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as SeedBody;

  const days = Math.max(1, Number(body.days ?? 1));
  const walletsCount = Math.max(5, Number(body.wallets ?? 30));
  const minTickets = Math.max(1, Number(body.minTickets ?? 40));
  const maxTickets = Math.max(minTickets, Number(body.maxTickets ?? 160));
  const clearDrawTickets = body.clearDrawTickets !== false; // default true
  const seedWinners = body.seedWinners !== false;           // default true
  const seedBonusDrops = body.seedBonusDrops !== false;     // default true

  // Pre-generate wallets (unique addresses)
  const walletAddresses = Array.from({ length: walletsCount }, () => randomWalletAddress());

  // Upsert wallets so we can re-run seed without exploding on unique address
  for (const address of walletAddresses) {
    await prisma.wallet.upsert({
      where: { address },
      update: {},
      create: { address },
    });
  }

  const seeded: any[] = [];
  const start = todayUtcStart();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const drawDate = addDaysUtc(start, dayOffset);

    // Ensure draw exists
    const draw = await prisma.draw.upsert({
      where: { drawDate },
      update: {},
      create: {
        drawDate,
        status: 'open',
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    });

    if (clearDrawTickets) {
      // wipe tickets + winners + bonus drops for this draw (clean slate)
      await prisma.winner.deleteMany({ where: { drawId: draw.id } });
      await prisma.bonusDrop.deleteMany({ where: { drawId: draw.id } });
      await prisma.ticket.deleteMany({ where: { drawId: draw.id } });
    }

    const ticketCount = randInt(minTickets, maxTickets);

    // Create tickets distributed across wallets
    const createdTicketIds: string[] = [];
    for (let i = 0; i < ticketCount; i++) {
      const address = walletAddresses[randInt(0, walletAddresses.length - 1)];

      const ticket = await prisma.ticket.create({
        data: {
          drawId: draw.id,
          code: makeTicketCode(),
          walletAddress: address,
          status: 'IN_DRAW',
          wallet: {
            connect: { address },
          },
        },
        select: { id: true },
      });

      createdTicketIds.push(ticket.id);
    }

    // Seed bonus drops (fake upcoming schedule)
    if (seedBonusDrops) {
      const now = Date.now();
      const bonusCount = randInt(1, 3);

      for (let i = 0; i < bonusCount; i++) {
        const mins = randInt(5, 90);
        const labels = ['Campfire Bonus', 'Pulse Bonus', 'Midnight Bonus', 'Hype Booster'];
        const label = labels[randInt(0, labels.length - 1)];

        await prisma.bonusDrop.create({
          data: {
            drawId: draw.id,
            label: `${label} #${i + 1}`,
            amountXpot: [100_000, 250_000, 500_000][randInt(0, 2)],
            scheduledAt: new Date(now + mins * 60 * 1000),
            status: 'SCHEDULED',
          },
        });
      }
    }

    // Seed winners (a couple fake results)
    if (seedWinners && createdTicketIds.length > 0) {
      const winnerPickCount = Math.min(randInt(1, 3), createdTicketIds.length);

      for (let i = 0; i < winnerPickCount; i++) {
        const ticketId = createdTicketIds[randInt(0, createdTicketIds.length - 1)];
        const t = await prisma.ticket.findUnique({
          where: { id: ticketId },
          select: { id: true, code: true, walletAddress: true, drawId: true },
        });

        if (!t) continue;

        await prisma.winner.create({
          data: {
            drawId: draw.id,
            ticketId: t.id,
            ticketCode: t.code,
            walletAddress: t.walletAddress,
            jackpotUsd: Number((Math.random() * 5000 + 200).toFixed(2)),
            payoutUsd: Number((Math.random() * 5000 + 50).toFixed(2)),
            isPaidOut: Math.random() < 0.2,
            kind: i === 0 ? 'MAIN' : 'BONUS',
            label: i === 0 ? 'Main XPOT' : 'Bonus XPOT',
          },
        });
      }
    }

    seeded.push({
      drawId: draw.id,
      drawDate: draw.drawDate.toISOString(),
      tickets: ticketCount,
      wallets: walletsCount,
      bonusDrops: seedBonusDrops ? 'seeded' : 'skipped',
      winners: seedWinners ? 'seeded' : 'skipped',
    });
  }

  return NextResponse.json({
    ok: true,
    seeded,
  });
}
