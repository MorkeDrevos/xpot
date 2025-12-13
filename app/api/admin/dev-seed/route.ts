// app/api/admin/dev-seed/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWalletAddress() {
  // Base58-ish (not strictly validated, but good enough for dev seed)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function utcStartOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

async function ensureDraw(drawDate: Date) {
  let draw = await prisma.draw.findFirst({ where: { drawDate } });

  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate,
        status: 'open',
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6h
      } as any,
    });
  }

  return draw;
}

async function seedTicketsForDraw(drawId: string, ticketCount: number) {
  // Create one dummy user for this seed batch
  const user = await prisma.user.create({ data: {} });

  // Clear old tickets for this draw to keep it deterministic
  await prisma.ticket.deleteMany({ where: { drawId } });

  for (let i = 0; i < ticketCount; i++) {
    const address = randomWalletAddress();

    await prisma.ticket.create({
      data: {
        drawId,
        userId: user.id,

        // Your schema uses a Wallet relation, so connectOrCreate it.
        wallet: {
          connectOrCreate: {
            where: { address } as any,
            create: { address } as any,
          },
        },

        status: 'IN_DRAW',
      } as any,
    });
  }

  return { userId: user.id, ticketCount };
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    // Allow overrides from body (optional)
    // Example:
    // { "todayTickets": 180, "historyDays": 6, "historyTicketsPerDay": 60 }
    const body = await req.json().catch(() => ({} as any));

    const todayTickets =
      typeof body?.todayTickets === 'number' ? Math.max(0, Math.floor(body.todayTickets)) : 120;

    const historyDays =
      typeof body?.historyDays === 'number' ? Math.max(0, Math.floor(body.historyDays)) : 4;

    const historyTicketsPerDay =
      typeof body?.historyTicketsPerDay === 'number'
        ? Math.max(0, Math.floor(body.historyTicketsPerDay))
        : 40;

    const now = new Date();
    const todayDrawDate = utcStartOfDay(now);

    // Seed today
    const todayDraw = await ensureDraw(todayDrawDate);
    const todaySeed = await seedTicketsForDraw(todayDraw.id, todayTickets);

    // Seed history draws (previous days)
    const history: Array<{
      drawDate: string;
      drawId: string;
      tickets: number;
    }> = [];

    for (let d = 1; d <= historyDays; d++) {
      const drawDate = utcStartOfDay(addDaysUtc(todayDrawDate, -d));
      const draw = await ensureDraw(drawDate);

      // For history, we don't delete tickets unless you want that behavior.
      // We'll just add tickets on top (more realistic), but keep it stable-ish.
      const extraTickets = historyTicketsPerDay;

      // Make a dummy user per day to keep relations simple
      const user = await prisma.user.create({ data: {} });

      for (let i = 0; i < extraTickets; i++) {
        const address = randomWalletAddress();

        await prisma.ticket.create({
          data: {
            drawId: draw.id,
            userId: user.id,
            wallet: {
              connectOrCreate: {
                where: { address } as any,
                create: { address } as any,
              },
            },
            status: 'IN_DRAW',
          } as any,
        });
      }

      history.push({
        drawDate: drawDate.toISOString(),
        drawId: draw.id,
        tickets: extraTickets,
      });
    }

    return NextResponse.json({
      ok: true,
      seeded: {
        today: {
          drawDate: todayDrawDate.toISOString(),
          drawId: todayDraw.id,
          tickets: todaySeed.ticketCount,
          userId: todaySeed.userId,
        },
        history,
      },
      note: 'Use POST with optional JSON body to control volumes.',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DEV_SEED_FAILED',
        message: err?.message || 'Unknown error',
      },
      { status: 500 },
    );
  }
}
