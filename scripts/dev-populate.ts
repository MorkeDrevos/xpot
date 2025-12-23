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
  const bucket = start; // canonical bucket key stored in Draw.drawDate (unique)

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
  let draw = await prisma.draw.findUnique({
    where: { drawDate: bucket },
  });

  if (!draw) {
    const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    draw = await prisma.draw.create({
      data: {
        drawDate: bucket,
        status: 'open',
        closesAt,
      },
    });
    console.log('[dev-populate] ✅ Created today draw:', {
      id: draw.id,
      drawDate: draw.drawDate,
      status: draw.status,
    });
  } else {
    console.log('[dev-populate] ℹ️ Today draw already exists:', {
      id: draw.id,
      drawDate: draw.drawDate,
      status: draw.status,
    });
  }

  // Config
  const WALLETS = intEnv('XPOT_DEV_WALLETS', 30);
  const TICKETS = intEnv('XPOT_DEV_TICKETS', 250);
  const ENTRIES = intEnv('XPOT_DEV_ENTRIES', 4);
  const BONUS_DROPS = intEnv('XPOT_DEV_BONUS_DROPS', 2);

  // 2) Create or reuse wallets
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

  console.log('[dev-populate] ✅ Wallets ready:', wallets.length);

  // 3) Create tickets for today's draw (1 per wallet per draw because of @@unique([walletId, drawId]))
  const maxPossible = Math.min(TICKETS, wallets.length);
  let createdTickets = 0;

  for (let i = 0; i < maxPossible; i++) {
    const w = wallets[i];

    try {
      await prisma.ticket.create({
        data: {
          code: ticketCode(),
          walletId: w.id, // ✅ REQUIRED
          walletAddress: w.address,
          status: 'IN_DRAW',
          drawId: draw.id,
        },
      });
      createdTickets++;
    } catch {
      // unique collision (wallet already has a ticket for this draw, or code collision)
      continue;
    }
  }

  console.log('[dev-populate] ✅ Tickets created for today:', createdTickets);

  // 4) Bonus drops (optional)
  if (BONUS_DROPS > 0) {
    let ensured = 0;
    for (let i = 0; i < BONUS_DROPS; i++) {
      const scheduledAt = new Date(Date.now() + (i + 1) * 60 * 60 * 1000);
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
        ensured++;
      } catch {
        // ignore duplicates
      }
    }
    console.log('[dev-populate] ✅ BonusDrops ensured:', ensured);
  }

  // 5) Public entrants (optional)
  const demoEntrants = [
    { clerkId: 'dev_clerk_01', xHandle: 'xpotbet', xName: 'XPOT', followers: 1200, verified: false },
    { clerkId: 'dev_clerk_02', xHandle: 'solana', xName: 'Solana', followers: 3000000, verified: true },
    { clerkId: 'dev_clerk_03', xHandle: 'jup_ag', xName: 'Jupiter', followers: 800000, verified: true },
    { clerkId: 'dev_clerk_04', xHandle: 'phantom', xName: 'Phantom', followers: 700000, verified: true },
  ];

  const targetEntrants = demoEntrants.slice(0, Math.min(ENTRIES, demoEntrants.length));
  let ensuredEntrants = 0;

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
      ensuredEntrants++;
    } catch {
      // already exists
    }
  }

  console.log('[dev-populate] ✅ Entrants ensured:', ensuredEntrants);
  console.log('[dev-populate] ✅ Done.');
  console.log('[dev-populate] Draw:', {
    id: draw.id,
    status: draw.status,
    drawDate: draw.drawDate,
    closesAt: draw.closesAt,
  });
  console.log('[dev-populate] Tip: max tickets per draw = number of wallets (because of @@unique([walletId, drawId])).');
}

main()
  .catch((e) => {
    console.error('[dev-populate] ❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
