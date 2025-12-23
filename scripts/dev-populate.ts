// scripts/dev-populate.ts
//
// Safe dev helper: creates today's draw (if missing) and inserts tickets (if below target).
// - Never deletes anything
// - Idempotent: re-running only tops up missing tickets
//
// Run:
//   npx tsx scripts/dev-populate.ts
// or:
//   node --loader ts-node/esm scripts/dev-populate.ts
//
// Optional env:
//   TARGET_TICKETS=50
//   DRAW_JACKPOT_XPOT=2500
//   DRAW_JACKPOT_USD=0
//   DRAW_ROLLOVER_USD=0
//   DRAW_CLOSES_IN_HOURS=24

import 'dotenv/config';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isoDayUTC(d = new Date()) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function getTodayRangeUTC() {
  const day = isoDayUTC();
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  return { start, end };
}

function randCode(prefix = 'XPOT') {
  // Short, unique, URL-safe-ish code
  const hex = crypto.randomBytes(6).toString('hex'); // 12 chars
  return `${prefix}-${hex}`.toUpperCase();
}

function randWallet() {
  // Dev-only placeholder wallet address format (Solana-like length)
  // NOTE: It's not a real keypair. It's just for DB rows.
  const hex = crypto.randomBytes(16).toString('hex'); // 32 chars
  return `DEV${hex}`; // keeps it obviously dev
}

async function main() {
  const TARGET_TICKETS = Number(process.env.TARGET_TICKETS ?? 30);

  const DRAW_JACKPOT_XPOT = Number(process.env.DRAW_JACKPOT_XPOT ?? 2500);
  const DRAW_JACKPOT_USD = Number(process.env.DRAW_JACKPOT_USD ?? 0);
  const DRAW_ROLLOVER_USD = Number(process.env.DRAW_ROLLOVER_USD ?? 0);
  const DRAW_CLOSES_IN_HOURS = Number(process.env.DRAW_CLOSES_IN_HOURS ?? 24);

  const { start, end } = getTodayRangeUTC();

  console.log(`[dev-populate] Looking for today's draw in UTC range: ${start.toISOString()} - ${end.toISOString()}`);

  // 1) Find today's draw (matching your /api/admin/pick-winner logic: status = 'open')
  let draw = await prisma.draw.findFirst({
    where: {
      drawDate: { gte: start, lt: end },
      status: 'open',
    },
    orderBy: { drawDate: 'desc' },
  });

  // 2) Create draw if missing
  if (!draw) {
    const closesAt = new Date(Date.now() + DRAW_CLOSES_IN_HOURS * 60 * 60 * 1000);

    console.log('[dev-populate] No open draw found. Creating one...');

    draw = await prisma.draw.create({
      data: {
        drawDate: new Date(),
        status: 'open',

        // These fields exist in your UI types/screenshots.
        // If Prisma complains about any of them, remove the offending key(s)
        // to match your actual schema.
        closesAt,
        jackpotXpot: DRAW_JACKPOT_XPOT,
        jackpotUsd: DRAW_JACKPOT_USD,
        rolloverUsd: DRAW_ROLLOVER_USD,
        ticketsCount: 0,
      } as any,
    });

    console.log(`[dev-populate] Created draw: ${draw.id}`);
  } else {
    console.log(`[dev-populate] Found draw: ${draw.id}`);
  }

  // 3) Count existing eligible tickets
  const existingCount = await prisma.ticket.count({
    where: {
      drawId: draw.id,
      status: 'IN_DRAW',
    },
  });

  console.log(`[dev-populate] IN_DRAW tickets existing: ${existingCount}`);

  if (existingCount >= TARGET_TICKETS) {
    console.log('[dev-populate] Nothing to do. Already at or above target.');
    return;
  }

  const toCreate = TARGET_TICKETS - existingCount;
  console.log(`[dev-populate] Creating ${toCreate} ticket(s)...`);

  const rows = Array.from({ length: toCreate }).map(() => ({
    drawId: draw!.id,
    status: 'IN_DRAW',
    walletAddress: randWallet(),
    code: randCode('XPOT'),
  }));

  // Use createMany for speed, but if your schema has unique constraints (code),
  // this will still be safe because codes are random.
  await prisma.ticket.createMany({
    data: rows as any,
  });

  // Optional: keep draw.ticketsCount updated if your schema uses it
  const newCount = await prisma.ticket.count({
    where: { drawId: draw.id, status: 'IN_DRAW' },
  });

  try {
    await prisma.draw.update({
      where: { id: draw.id },
      data: { ticketsCount: newCount } as any,
    });
  } catch {
    // If your schema doesn't have ticketsCount or it's computed elsewhere, ignore.
  }

  console.log(`[dev-populate] Done. IN_DRAW tickets now: ${newCount}`);
}

main()
  .catch((e) => {
    console.error('[dev-populate] Failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
