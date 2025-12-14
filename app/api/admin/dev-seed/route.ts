// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isDevRequest(req: Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase();
  if (vercelEnv === 'production') return false;
  if (host.startsWith('dev.') || host.includes('localhost')) return true;
  return vercelEnv === 'preview';
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase58(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function fakeWallet() {
  return randomBase58(44);
}

function fakeTxUrl() {
  return `https://solscan.io/tx/${randomBase58(88)}`;
}

function startOfUtcDay(d = new Date()) {
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (!isDevRequest(req)) {
    return NextResponse.json(
      { ok: false, error: 'DEV_ONLY', message: 'Dev seed disabled in production.' },
      { status: 403 },
    );
  }

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === '1';

    const start = startOfUtcDay();

    const [drawCount, ticketCount] = await Promise.all([
      prisma.draw.count(),
      prisma.ticket.count(),
    ]);

    const isEmpty = drawCount === 0 && ticketCount === 0;

    if (!force && !isEmpty) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: 'DB not empty – seed skipped.',
      });
    }

    // 1️⃣ Ensure today's draw
    let draw = await prisma.draw.findFirst({
      where: { drawDate: start },
    });

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          drawDate: start,
          status: 'open',
          ticketsCount: 0,
          closesAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    }

    // 2️⃣ Tickets
    const tickets = Array.from({ length: 10 }).map((_, i) => ({
      drawId: draw.id,
      code: `XPOT-${randInt(100000, 999999)}-${i + 1}`,
      walletAddress: fakeWallet(),
      status: 'in-draw',
    }));

    await prisma.ticket.createMany({ data: tickets });

    const ticketTotal = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    await prisma.draw.update({
      where: { id: draw.id },
      data: { ticketsCount: ticketTotal },
    });

    // 3️⃣ Winner (optional model)
    const winnerModel = (prisma as any).winner;
    if (winnerModel?.create) {
      const t = await prisma.ticket.findFirst({ where: { drawId: draw.id } });
      if (t) {
        await winnerModel.create({
          data: {
            drawId: draw.id,
            date: start,
            ticketCode: t.code,
            walletAddress: t.walletAddress,
            payoutUsd: 1000000,
            isPaidOut: true,
            txUrl: fakeTxUrl(),
            kind: 'main',
            label: 'Main XPOT',
          },
        });
      }
    }

    return NextResponse.json({ ok: true, seeded: true });
  } catch (err: any) {
    console.error('[DEV-SEED]', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'SEED_FAILED',
        message: err.message,
      },
      { status: 500 },
    );
  }
}
