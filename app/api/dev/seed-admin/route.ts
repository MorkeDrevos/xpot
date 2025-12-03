// app/api/dev/seed-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 🔐 Safety: block on production unless you explicitly allow it
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'DEV_SEED_DISABLED_IN_PROD' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');

  // Optional simple guard so random people can’t hit it
  const expected = process.env.DEV_SEED_SECRET || 'xpot-dev-seed';
  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 },
    );
  }

  // 1) Dev user + wallets
  const devUser = await prisma.user.upsert({
    where: { xHandle: 'dev_xpot_user' },
    update: {},
    create: { xHandle: 'dev_xpot_user' },
  });

  const walletAddresses = [
    'DevWallet111111111111111111111111111111',
    'DevWallet222222222222222222222222222222',
    'DevWallet333333333333333333333333333333',
  ];

  const wallets = await Promise.all(
    walletAddresses.map((address) =>
      prisma.wallet.upsert({
        where: { address },
        update: {},
        create: {
          address,
          userId: devUser.id,
        },
      }),
    ),
  );

  // Helper to get today range
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // 2) Today’s draw (OPEN)
  let todayDraw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (!todayDraw) {
  todayDraw = await prisma.draw.create({
    data: {
      drawDate: new Date(),
      jackpotUsd: 6_050_000,
    },
  });
}

  // 3) Tickets for today's draw
const ticketPayload = Array.from({ length: 20 }).map((_, i) => {
  const wallet = wallets[i % wallets.length];
  return {
    code: `XPOT-DEV${String(i + 1).padStart(4, '0')}`,
    status: TicketStatus.IN_DRAW,
    walletId: wallet.id,
    userId: wallet.userId,
    drawId: todayDraw.id,
  };
});

// createMany skips duplicates nicely if re-run
await prisma.ticket.createMany({
  data: ticketPayload,
  skipDuplicates: true,
});

  // 4) Two past draws with winners for the right column

  // Helper to create a past draw + winner bundle
async function ensurePastDraw(daysAgo: number, label: string, amountUsd: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59),
  );

  let draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lt: end,
      },
    },
  });

  // Create the past draw if it doesn't exist yet
  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate: date,
        jackpotUsd: amountUsd,
      },
    });
  }

  // Make sure there is at least one ticket to attach
  const existingTicket = await prisma.ticket.findFirst({
    where: { drawId: draw.id },
  });

  const ticket =
    existingTicket ||
    (await prisma.ticket.create({
      data: {
        code: `XPOT-PAST-${daysAgo}-0001`,
        status: TicketStatus.IN_DRAW,
        walletId: wallets[0].id,
        userId: wallets[0].userId,
        drawId: draw.id,
      },
    }));

  // NOTE: We are *not* seeding winners here anymore because there is no
  // `winner` model on the Prisma client. Once the schema has a Winner table,
  // we can re-introduce a prisma.winner.create() here.
}

    // Winner linked to that ticket
    await prisma.winner.upsert({
      where: {
        // if you have a unique constraint like `ticketId`, adjust this
        // otherwise create by `id` using some fixed id
        ticketId: ticket.id,
      } as any,
      update: {},
      create: {
        drawId: draw.id,
        ticketId: ticket.id,
        jackpotUsd: amountUsd,
        payoutUsd: amountUsd,
        isPaidOut: true,
        label,
        kind: 'main', // or 'MAIN' depending on your enum
      },
    });
  }

  await ensurePastDraw(1, 'Main jackpot', 5_000_000);
  await ensurePastDraw(2, 'Bonus jackpot', 1_000_000);

  return NextResponse.json({
    ok: true,
    message: 'Dev admin data seeded.',
  });
}
