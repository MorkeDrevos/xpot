// scripts/dev-populate.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

function todayUtcBucket() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  const bucket = start; // canonical bucket stored in Draw.drawDate (unique)
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
  // Not a real Solana address - just a unique string for your schema.
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

  // 0) Ensure singleton ops config exists
  await prisma.opsConfig.upsert({
    where: { singleton: 'singleton' },
    update: {},
    create: { singleton: 'singleton', mode: 'MANUAL' },
  });

  // 1) Ensure today's draw exists (drawDate is unique)
  const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const draw = await prisma.draw.upsert({
    where: { drawDate: bucket },
    update: { closesAt },
    create: { drawDate: bucket, status: 'open', closesAt },
  });

  console.log('[dev-populate] Draw ready:', {
    id: draw.id,
    status: draw.status,
    drawDate: draw.drawDate,
    closesAt: draw.closesAt,
  });

  // Config
  const WALLETS = intEnv('XPOT_DEV_WALLETS', 30);
  const TICKETS = intEnv('XPOT_DEV_TICKETS', 250);
  const ENTRIES = intEnv('XPOT_DEV_ENTRIES', 18);
  const BONUS_DROPS = intEnv('XPOT_DEV_BONUS_DROPS', 2);

  // 2) Ensure we have at least WALLETS wallets
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
      // address collision - retry
    }
  }

  console.log('[dev-populate] Wallets ready:', wallets.length);

  // 3) Create tickets for today's draw
  // IMPORTANT: schema has @@unique([walletId, drawId]) => max 1 ticket per wallet per draw
  const maxPossible = Math.min(TICKETS, wallets.length);

  let createdTickets = 0;
  let existingTickets = 0;

  for (let i = 0; i < maxPossible; i++) {
    const w = wallets[i];

    // If ticket already exists for this wallet+draw, skip.
    const already = await prisma.ticket.findUnique({
      where: {
        walletId_drawId: {
          walletId: w.id,
          drawId: draw.id,
        },
      },
      select: { id: true },
    });

    if (already) {
      existingTickets++;
      continue;
    }

    // Create the required fields: code, walletId, walletAddress, status, drawId
    await prisma.ticket.create({
      data: {
        code: ticketCode(),
        walletId: w.id,
        walletAddress: w.address,
        status: 'IN_DRAW',
        drawId: draw.id,
      },
    });

    createdTickets++;
  }

  console.log('[dev-populate] Tickets:', {
    requested: TICKETS,
    possible: maxPossible,
    created: createdTickets,
    alreadyExisted: existingTickets,
  });

  // 4) Bonus drops (optional) - safe inserts, no wipes
  let bonusCreated = 0;
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
        bonusCreated++;
      } catch {
        // ignore duplicates if any
      }
    }
  }

  console.log('[dev-populate] BonusDrops created:', bonusCreated);

  // 5) Public entrants (optional)
  const demoEntrants = [
    { clerkId: 'dev_clerk_01', xHandle: 'xpotbet', xName: 'XPOT', followers: 1200, verified: false },
    { clerkId: 'dev_clerk_02', xHandle: 'solana', xName: 'Solana', followers: 3000000, verified: true },
    { clerkId: 'dev_clerk_03', xHandle: 'jup_ag', xName: 'Jupiter', followers: 800000, verified: true },
    { clerkId: 'dev_clerk_04', xHandle: 'phantom', xName: 'Phantom', followers: 700000, verified: true },
  ];

  const targetEntrants = demoEntrants.slice(0, Math.min(ENTRIES, demoEntrants.length));
  if (targetEntrants.length) {
    await prisma.drawEntry.createMany({
      data: targetEntrants.map((e) => ({
        drawId: draw.id,
        clerkId: e.clerkId,
        xHandle: e.xHandle,
        xName: e.xName,
        xAvatarUrl: null,
        followers: e.followers,
        verified: e.verified,
      })),
      skipDuplicates: true, // respects @@unique([drawId, clerkId])
    });
  }

  console.log('[dev-populate] Entrants ensured:', targetEntrants.length);
  console.log('[dev-populate] ✅ Done.');
}

main()
  .catch((e) => {
    console.error('[dev-populate] ❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
