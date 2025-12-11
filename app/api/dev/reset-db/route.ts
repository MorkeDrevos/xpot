// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Shared handler for both GET and POST
async function handleReset(req: NextRequest) {
  // 🔐 Extra safety: only allow on dev.xpot.bet
  if (!req.nextUrl.hostname.startsWith('dev.')) {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_IN_PROD' },
      { status: 403 },
    );
  }

  // Simple secret check
  const secret = req.nextUrl.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';
  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 },
    );
  }

  try {
    // ─────────────────────────────────────────────
    // 1) Nuke legacy tables that can block FK deletions
    // ─────────────────────────────────────────────
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "Reward";`);
    } catch {
      // ignore if table doesn't exist
    }

    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "XpUserBalance";`);
    } catch {
      // ignore if table doesn't exist
    }

    // ─────────────────────────────────────────────
    // 2) Clear core XPOT tables
    // ─────────────────────────────────────────────
    await prisma.$transaction([
      prisma.winner.deleteMany(),
      prisma.ticket.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.draw.deleteMany(),
      prisma.user.deleteMany(),
      prisma.bonusDrop.deleteMany(),
    ]);

    // ─────────────────────────────────────────────
    // 3) Seed demo state:
    //    • Yesterday: completed draw with paid winner
    //    • Today: open draw with live entries
    // ─────────────────────────────────────────────
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

    const yesterdayClosesAt = new Date(
      yesterdayStart.getTime() + 22 * 60 * 60 * 1000,
    );
    const todayClosesAt = new Date(
      todayStart.getTime() + 4 * 60 * 60 * 1000,
    );

    // Users
    const userAlpha = await prisma.user.create({
      data: {
        xHandle: 'dev_alpha_x',
      },
    });
    const userBeta = await prisma.user.create({
      data: {
        xHandle: 'dev_beta_x',
      },
    });
    const userGamma = await prisma.user.create({
      data: {
        xHandle: 'dev_gamma_x',
      },
    });

    // Wallets
    const walletAlpha = await prisma.wallet.create({
      data: {
        address: 'DevWalletALPHA1111111111111111',
        userId: userAlpha.id,
      },
    });
    const walletBeta = await prisma.wallet.create({
      data: {
        address: 'DevWalletBETA2222222222222222',
        userId: userBeta.id,
      },
    });
    const walletGamma = await prisma.wallet.create({
      data: {
        address: 'DevWalletGAMMA33333333333333',
        userId: userGamma.id,
      },
    });

    // Draws
    const completedDraw = await prisma.draw.create({
      data: {
        drawDate: yesterdayStart,
        closesAt: yesterdayClosesAt,
        status: 'completed',
      },
    });

    const todayDraw = await prisma.draw.create({
      data: {
        drawDate: todayStart,
        closesAt: todayClosesAt,
        status: 'open',
      },
    });

    // Tickets
    // Winner ticket for yesterday's completed draw
    const winningTicket = await prisma.ticket.create({
      data: {
        code: 'AUTO-DEV-YESTERDAY-001',
        status: 'WON',
        drawId: completedDraw.id,
        walletId: walletAlpha.id,
        walletAddress: walletAlpha.address,
      },
    });

    // Winner row for yesterday's draw
    const winner = await prisma.winner.create({
      data: {
        drawId: completedDraw.id,
        ticketId: winningTicket.id,
        date: now,
        ticketCode: winningTicket.code,
        walletAddress: winningTicket.walletAddress,
        jackpotUsd: 1_000_000,
        payoutUsd: 1_000_000,
        isPaidOut: true,
        txUrl: 'https://solscan.io/tx/DEV_COMPLETED_DRAW',
        kind: 'MAIN',
        label: 'Dev seed main winner',
      },
    });

    // Two live entries for today's open draw
    const todayTicket1 = await prisma.ticket.create({
      data: {
        code: 'AUTO-DEV-TODAY-001',
        status: 'IN_DRAW',
        drawId: todayDraw.id,
        walletId: walletBeta.id,
        walletAddress: walletBeta.address,
      },
    });

    const todayTicket2 = await prisma.ticket.create({
      data: {
        code: 'AUTO-DEV-TODAY-002',
        status: 'IN_DRAW',
        drawId: todayDraw.id,
        walletId: walletGamma.id,
        walletAddress: walletGamma.address,
      },
    });

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      users: 3,
      wallets: 3,
      tickets: 3,
      winnerId: winner.id,
      completedDrawId: completedDraw.id,
      todayDrawId: todayDraw.id,
      todayTicketIds: [todayTicket1.id, todayTicket2.id],
    });
  } catch (err) {
    console.error('DEV_RESET_ERROR', err);
    return NextResponse.json(
      { ok: false, error: 'RESET_FAILED' },
      { status: 500 },
    );
  }
}

// Allow both GET + POST for convenience
export const GET = handleReset;
export const POST = handleReset;
