// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

const MADRID_TZ = 'Europe/Madrid';
const CUTOFF_HH = 22;
const CUTOFF_MM = 0;

// Compute timezone offset in ms for a given Date in a specific IANA timezone.
// Returns: (wallClockAsUTC - realUTC) for that instant.
function getTzOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const y = Number(get('year'));
  const m = Number(get('month'));
  const d = Number(get('day'));
  const hh = Number(get('hour'));
  const mm = Number(get('minute'));
  const ss = Number(get('second'));

  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return asUTC - date.getTime();
}

// Convert a Madrid wall-clock timestamp (y,m,d,hh,mm,ss) into UTC ms safely (DST aware).
function madridWallClockToUtcMs(y: number, m: number, d: number, hh: number, mm: number, ss: number) {
  const utcGuessMs = Date.UTC(y, m - 1, d, hh, mm, ss);
  const guessDate = new Date(utcGuessMs);
  const offsetMs = getTzOffsetMs(guessDate, MADRID_TZ);
  return utcGuessMs - offsetMs;
}

function addDaysUtc(ms: number, days: number) {
  return ms + days * 24 * 60 * 60 * 1000;
}

function getMadridNowParts(now: Date) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: MADRID_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  return {
    y: Number(get('year')),
    m: Number(get('month')),
    d: Number(get('day')),
    hh: Number(get('hour')),
    mm: Number(get('minute')),
    ss: Number(get('second')),
  };
}

// Madrid day bucket with cutoff at 22:00 local time.
// If Madrid time is before 22:00, the bucket started yesterday at 22:00.
// If Madrid time is >= 22:00, the bucket starts today at 22:00.
// Returns UTC [start, endExclusive).
function getTodayRangeMadridCutoffUtc() {
  const now = new Date();
  const madrid = getMadridNowParts(now);

  const beforeCutoff =
    madrid.hh < CUTOFF_HH || (madrid.hh === CUTOFF_HH && madrid.mm < CUTOFF_MM);

  // Start wall-clock is today 22:00 if >= cutoff, else yesterday 22:00
  const startY = madrid.y;
  const startM = madrid.m;
  const startD = madrid.d;

  const startUtcMsToday = madridWallClockToUtcMs(startY, startM, startD, CUTOFF_HH, CUTOFF_MM, 0);
  const startUtcMs = beforeCutoff ? addDaysUtc(startUtcMsToday, -1) : startUtcMsToday;

  const endUtcMs = addDaysUtc(startUtcMs, 1);

  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
  };
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { start, end } = getTodayRangeMadridCutoffUtc();

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
        status: 'open',
      },
      orderBy: [{ drawDate: 'desc' }, { id: 'desc' }],
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_OPEN_DRAW_FOR_TODAY_MADRID_BUCKET', bucket: { start, end } },
        { status: 400 },
      );
    }

    const existingWinner = await prisma.winner.findFirst({
      where: { drawId: draw.id, kind: 'MAIN' },
      include: { ticket: { include: { wallet: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });

    if (existingWinner) {
      return NextResponse.json(
        {
          ok: true,
          winner: {
            ticketId: existingWinner.ticketId,
            code: existingWinner.ticketCode,
            wallet: existingWinner.ticket.wallet?.address ?? existingWinner.walletAddress,
            jackpotUsd: existingWinner.jackpotUsd,
            payoutUsd: existingWinner.payoutUsd,
            kind: existingWinner.kind ?? 'MAIN',
            isPaidOut: existingWinner.isPaidOut,
          },
        },
        { status: 200 },
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id, status: 'IN_DRAW' },
      include: { wallet: true },
    });

    if (!tickets.length) {
      return NextResponse.json({ ok: false, error: 'NO_TICKETS_IN_DRAW' }, { status: 400 });
    }

    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
    const jackpotUsd = 0;

    const [updatedTicket, newWinner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.winner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          ticketCode: winningTicket.code,
          walletAddress: winningTicket.walletAddress,
          date: new Date(),
          jackpotUsd,
          payoutUsd: jackpotUsd,
          isPaidOut: false,
          kind: 'MAIN',
          label: 'Main XPOT winner',
        },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        winner: {
          ticketId: updatedTicket.id,
          code: updatedTicket.code,
          wallet: winningTicket.wallet?.address ?? winningTicket.walletAddress ?? '',
          jackpotUsd: newWinner.jackpotUsd,
          payoutUsd: newWinner.payoutUsd,
          kind: newWinner.kind ?? 'MAIN',
          isPaidOut: newWinner.isPaidOut,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/pick-winner error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
