// app/api/admin/dev-seed/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

function randomWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

// Ticket.code generator (safe for @unique)
function ticketCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing 0/1/I/O
  let s = 'XPOT-';
  for (let i = 0; i < 18; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function utcStartOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return utcStartOfDay(x);
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as any;

  const days = Number(body?.days ?? 7);
  const usersCount = Number(body?.users ?? 30);
  const minTicketsPerDraw = Number(body?.minTickets ?? 40);
  const maxTicketsPerDraw = Number(body?.maxTickets ?? 160);
  const closeSomeDraws = Boolean(body?.closeSomeDraws ?? true);
  const clearRange = Boolean(body?.clearRange ?? true);

  const today = utcStartOfDay(new Date());

  try {
    // Create users
    const users = [];
    for (let i = 0; i < usersCount; i++) {
      users.push(await prisma.user.create({ data: {} }));
    }

    // Pre-create wallets
    const wallets: { address: string }[] = [];
    const walletCount = Math.max(usersCount * 2, 60);
    for (let i = 0; i < walletCount; i++) wallets.push({ address: randomWalletAddress() });

    for (const w of wallets) {
      await prisma.wallet.upsert({
        where: { address: w.address } as any,
        update: {},
        create: { address: w.address } as any,
      });
    }

    // Optional clear range
    if (clearRange) {
      const from = addDaysUtc(today, -(days - 1));
      const to = addDaysUtc(today, 1);

      const drawsInRange = await prisma.draw.findMany({
        where: { drawDate: { gte: from, lt: to } } as any,
        select: { id: true },
      });

      const drawIds = drawsInRange.map((d) => d.id);

      if (drawIds.length) {
        await prisma.ticket.deleteMany({ where: { drawId: { in: drawIds } } as any });
        await prisma.draw.deleteMany({ where: { id: { in: drawIds } } as any });
      }
    }

    // Seed draws + tickets
    const createdDraws: any[] = [];
    let totalTickets = 0;

    for (let i = 0; i < days; i++) {
      const drawDate = addDaysUtc(today, -(days - 1) + i);
      const closesAt = new Date(drawDate.getTime() + randInt(3, 10) * 60 * 60 * 1000);

      const draw = await prisma.draw.create({
        data: {
          drawDate,
          status: 'open',
          closesAt,
        } as any,
      });

      const ticketCount = randInt(minTicketsPerDraw, maxTicketsPerDraw);
      totalTickets += ticketCount;

      for (let t = 0; t < ticketCount; t++) {
        const user = pick(users);
        const wallet = pick(wallets);

        // If code collision happens (rare), retry a couple times
        let created = false;
        for (let tries = 0; tries < 5 && !created; tries++) {
          const code = ticketCode();

          try {
            await prisma.ticket.create({
              data: {
                drawId: draw.id,
                userId: user.id,

                // REQUIRED in your schema (error proves it)
                code,

                wallet: {
                  connect: { address: wallet.address } as any,
                },

                status: 'IN_DRAW',
              } as any,
            });

            created = true;
          } catch (e: any) {
            // retry only on unique-ish collisions
            const msg = String(e?.message || '');
            const looksLikeUnique = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint');
            if (!looksLikeUnique) throw e;
          }
        }
      }

      createdDraws.push({ id: draw.id, drawDate: draw.drawDate, closesAt: draw.closesAt });

      // Optionally close earlier draws (best-effort)
      if (closeSomeDraws && i < days - 1) {
        await prisma.draw.update({
          where: { id: draw.id } as any,
          data: { status: 'completed' } as any,
        }).catch(() => null);
      }
    }

    return NextResponse.json({
      ok: true,
      seeded: {
        days,
        users: usersCount,
        wallets: walletCount,
        tickets: totalTickets,
        draws: createdDraws.length,
        clearRange,
        closeSomeDraws,
      },
      draws: createdDraws,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DEV_SEED_FAILED',
        message: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
