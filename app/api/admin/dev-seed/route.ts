// app/api/admin/prod-seed/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randomHandle() {
  const a = ['Candle', 'Loop', 'Nebula', 'Alpha', 'Sol', 'XPOT', 'Hype', 'Vault', 'Sigma', 'Turbo'];
  const b = ['Chaser', 'Monk', 'Pilot', 'Hermit', 'Wizard', 'Sniper', 'Maxi', 'Degen', 'Smith', 'Ranger'];
  return `${sample(a)}${sample(b)}_${randInt(10, 9999)}`;
}

type Body = {
  confirm?: string; // must be "SEED_PROD"
  wallets?: number;
  ticketsPerDay?: number;
  days?: number; // how many past days to create
  winnersPerDay?: number;
  bonusDropsPerDay?: number;
};

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Hard safety gate (you must explicitly allow this in Vercel env)
  const allow = (process.env.XPOT_ALLOW_PROD_SEED ?? '').toLowerCase() === 'true';
  if (!allow) {
    return NextResponse.json(
      {
        ok: false,
        error: 'PROD_SEED_DISABLED',
        message: 'Set XPOT_ALLOW_PROD_SEED=true to enable production seeding.',
      },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  if ((body.confirm ?? '') !== 'SEED_PROD') {
    return NextResponse.json(
      {
        ok: false,
        error: 'CONFIRM_REQUIRED',
        message: 'Missing confirm. Send { confirm: "SEED_PROD" } in body.',
      },
      { status: 400 },
    );
  }

  const walletsCount = Math.max(5, Math.min(200, Number(body.wallets ?? 30)));
  const days = Math.max(1, Math.min(30, Number(body.days ?? 7)));
  const ticketsPerDay = Math.max(5, Math.min(2000, Number(body.ticketsPerDay ?? 120)));
  const winnersPerDay = Math.max(1, Math.min(50, Number(body.winnersPerDay ?? 5)));
  const bonusDropsPerDay = Math.max(0, Math.min(50, Number(body.bonusDropsPerDay ?? 3)));

  const now = new Date();

  // NOTE:
  // This assumes typical models: User, Wallet, Draw, Ticket, Winner, BonusDrop.
  // If your schema differs, paste those models and I’ll adjust the field names exactly.

  // 1) Create users + wallets
  const createdWalletIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < walletsCount; i++) {
      // Create a user (if your Wallet model does not require userId, you can remove this)
      const user = await tx.user.create({
        data: {
          // adjust if required fields differ
          xHandle: randomHandle(),
          xAvatarUrl: `https://unavatar.io/x/${randomHandle()}`,
          // clerkId optional - leave null if allowed
        } as any,
      });

      const wallet = await tx.wallet.create({
        data: {
          // adjust if required fields differ
          address: randomWalletAddress(),
          userId: (user as any).id,
        } as any,
      });

      createdWalletIds.push((wallet as any).id);
    }

    // 2) Create draws, tickets, winners, bonusDrops for N days (including today)
    for (let di = 0; di < days; di++) {
      const day = new Date(now.getTime() - di * 24 * 60 * 60 * 1000);
      const drawDate = todayUtcStart(day);

      const closesAt = new Date(drawDate.getTime() + 7 * 60 * 60 * 1000);

      const draw = await tx.draw.upsert({
        where: { drawDate },
        update: {},
        create: {
          drawDate,
          status: 'open',
          closesAt,
        } as any,
      });

      // Tickets
      const tickets: any[] = [];
      for (let t = 0; t < ticketsPerDay; t++) {
        tickets.push({
          drawId: (draw as any).id,
          walletId: sample(createdWalletIds),
          status: 'IN_DRAW',
          // add more fields here if your Ticket requires them (e.g. createdAt)
        });
      }

      // createMany returns count only, so later we’ll fetch some tickets to mark winners
      await tx.ticket.createMany({ data: tickets as any[] });

      // Bonus drops
      for (let b = 0; b < bonusDropsPerDay; b++) {
        const scheduledAt = new Date(drawDate.getTime() + (10 + b * 20) * 60 * 1000); // 10m, 30m, 50m...
        await tx.bonusDrop.create({
          data: {
            drawId: (draw as any).id,
            label: di === 0 ? `Bonus XPOT (today) #${b + 1}` : `Bonus XPOT #${b + 1}`,
            amountXpot: randInt(10_000, 250_000),
            scheduledAt,
            status: scheduledAt < now ? 'FIRED' : 'SCHEDULED',
          } as any,
        });
      }

      // Winners (pick from tickets)
      const pickPool = await tx.ticket.findMany({
        where: { drawId: (draw as any).id },
        take: Math.min(5000, ticketsPerDay),
      });

      const winners = new Set<string>();
      while (winners.size < Math.min(winnersPerDay, pickPool.length)) {
        winners.add(sample(pickPool as any[]).id);
      }

      // Mark winners + create Winner rows
      for (const ticketId of winners) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: 'WON' } as any,
        });

        await tx.winner.create({
          data: {
            drawId: (draw as any).id,
            ticketId,
            label: di === 0 ? 'Main XPOT (today)' : 'Main XPOT',
            amountXpot: di === 0 ? 10_000_000 : randInt(1_000_000, 10_000_000),
            status: 'PAID', // or whatever your Winner status enum is
            // txUrl optional
          } as any,
        });
      }

      // Close older draws
      if (di > 0) {
        await tx.draw.update({
          where: { id: (draw as any).id },
          data: { status: 'closed' } as any,
        });
      }
    }
  });

  return NextResponse.json({
    ok: true,
    seeded: {
      wallets: walletsCount,
      days,
      ticketsPerDay,
      winnersPerDay,
      bonusDropsPerDay,
    },
  });
}
