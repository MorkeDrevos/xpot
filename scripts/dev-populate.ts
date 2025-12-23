// scripts/dev-populate.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function todayUtcBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));

  // canonical "bucket key" stored in Draw.drawDate (unique)
  const bucket = start;

  return { start, end, bucket };
}

function intEnv(name: string, fallback: number) {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function randHex(len: number) {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function fakeSolAddress() {
  // Wallet.address is just a string in your schema.
  return `DEV${randHex(40)}`;
}

function ticketCode() {
  return `XPOT-${randHex(6).toUpperCase()}-${randHex(6).toUpperCase()}`;
}

async function main() {
  const { start, end, bucket } = todayUtcBucket();

  console.log(
    `[dev-populate] UTC day bucket: ${start.toISOString()} - ${end.toISOString()} (drawDate=${bucket.toISOString()})`,
  );

  // 0) Ensure singleton ops config exists (safe upsert)
  await prisma.opsConfig.upsert({
    where: { singleton: 'singleton' },
    update: {},
    create: { singleton: 'singleton', mode: 'MANUAL' },
  });

  // Config
  const WALLETS = intEnv('XPOT_DEV_WALLETS', 30);
  const TICKETS = intEnv('XPOT_DEV_TICKETS', 250);
  const ENTRIES = intEnv('XPOT_DEV_ENTRIES', 18);
  const BONUS_DROPS = intEnv('XPOT_DEV_BONUS_DROPS', 2);

  // 1) Ensure today's draw exists (drawDate is unique)
  const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
  const draw = await prisma.draw.upsert({
    where: { drawDate: bucket },
    update: {
      // keep it open for dev if it already exists
      status: 'open',
      closesAt: closesAt,
    },
    create: {
      drawDate: bucket,
      status: 'open',
      closesAt: closesAt,
    },
  });

  console.log('[dev-populate] ✅ Draw ready:', {
    id: draw.id,
    drawDate: draw.drawDate,
    status: draw.status,
    closesAt: draw.closesAt,
  });

  // 2) Create/reuse wallets (safe, no wipes)
  const existingWallets = await prisma.wallet.findMany({
    orderBy: { createdAt: 'asc' },
    take: WALLETS,
  });

  const wallets = [...existingWallets];
  while (wallets.length < WALLETS) {
    const address = fakeSolAddress();
    try {
      const w = await prisma.wallet.create({ data: { address } });
      wallets.push(w);
    } catch {
      // address collision, retry
    }
  }

  console.log('[dev-populate] ✅ Wallets ready:', wallets.length);

  // 3) Create tickets for today's draw
  // IMPORTANT: your schema has @@unique([walletId, drawId]) => max 1 ticket per wallet per draw
  const maxPossible = Math.min(TICKETS, wallets.length);
  let createdTickets = 0;

  for (let i = 0; i < maxPossible; i++) {
    const w = wallets[i % wallets.length];

    try {
      await prisma.ticket.create({
        data: {
          code: ticketCode(),
          walletId: w.id, // REQUIRED
          walletAddress: w.address,
          status: 'IN_DRAW',
          drawId: draw.id,
        },
      });
      createdTickets++;
    } catch {
      // likely unique collision (wallet already has ticket in this draw) or code collision
      continue;
    }
  }

  console.log('[dev-populate] ✅ Tickets created for today:', createdTickets);

  // 4) Bonus drops (safe inserts)
  let bonusEnsured = 0;
  if (BONUS_DROPS > 0) {
    for (let i = 0; i < BONUS_DROPS; i++) {
      const scheduledAt = new Date(Date.now() + (i + 1) * 60 * 60 * 1000); // +1h, +2h...
      try {
        await prisma.bonusDrop.create({
          data: {
            drawId: draw.id,
            label: `Bonus Drop #${i + 1}`,
            amountXpot: 250,
            scheduledAt,
            status: 'SCHEDULED',
          },
        });
        bonusEnsured++;
      } catch {
        // ignore duplicates on rerun
      }
    }
  }

  console.log('[dev-populate] ✅ BonusDrops ensured (this run):', bonusEnsured);

  // 5) Public entrants (DrawEntry) (safe inserts)
  const demoEntrants = [
    { clerkId: 'dev_clerk_01', xHandle: 'xpotbet', xName: 'XPOT', followers: 1200, verified: false },
    { clerkId: 'dev_clerk_02', xHandle: 'solana', xName: 'Solana', followers: 3000000, verified: true },
    { clerkId: 'dev_clerk_03', xHandle: 'jup_ag', xName: 'Jupiter', followers: 800000, verified: true },
    { clerkId: 'dev_clerk_04', xHandle: 'phantom', xName: 'Phantom', followers: 700000, verified: true },
  ];

  const targetEntrants = demoEntrants.slice(0, Math.min(ENTRIES, demoEntrants.length));
  let entrantsEnsured = 0;

  for (const e of targetEntrants) {
    try {
      await prisma.drawEntry.create({
        data: {
          drawId: draw.id,
          clerkId: e.clerkId,
          xHandle: e.xHandle,
          xName: e.xName,
          xAvatarUrl: null,
          followers: e.followers,
          verified: e.verified,
        },
      });
      entrantsEnsured++;
    } catch {
      // already exists: @@unique([drawId, clerkId])
    }
  }

  console.log('[dev-populate] ✅ Entrants ensured (this run):', entrantsEnsured);

  // 6) Quick totals to confirm in terminal
  const totals = await Promise.all([
    prisma.draw.count(),
    prisma.wallet.count(),
    prisma.ticket.count({ where: { drawId: draw.id } }),
    prisma.bonusDrop.count({ where: { drawId: draw.id } }),
    prisma.drawEntry.count({ where: { drawId: draw.id } }),
  ]);

  console.log('[dev-populate] ✅ Totals:', {
    draws: totals[0],
    wallets: totals[1],
    ticketsInTodayDraw: totals[2],
    bonusDropsInTodayDraw: totals[3],
    entrantsInTodayDraw: totals[4],
  });

  console.log('[dev-populate] Done.');
}

main()
  .catch((e) => {
    console.error('[dev-populate] ❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
