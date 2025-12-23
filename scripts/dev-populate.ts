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

  // 0) Ensure ops config exists
  await prisma.opsConfig.upsert({
    where: { singleton: 'singleton' },
    update: {},
    create: { singleton: 'singleton', mode: 'MANUAL' },
  });

  // 1) Ensure today's draw exists
  let draw = await prisma.draw.findUnique({
    where: { drawDate: bucket },
  });

  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate: bucket,
        status: 'open',
        closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log('[dev-populate] ✅ Created today draw:', draw.id);
  } else {
    console.log('[dev-populate] ℹ️ Today draw already exists:', draw.id);
  }

  // Config
  const WALLETS = intEnv('XPOT_DEV_WALLETS', 30);
  const TICKETS = intEnv('XPOT_DEV_TICKETS', 250);
  const ENTRIES = intEnv('XPOT_DEV_ENTRIES', 18);
  const BONUS_DROPS = intEnv('XPOT_DEV_BONUS_DROPS', 2);

  // 2) Wallets
  const existingWallets = await prisma.wallet.findMany({
    orderBy: { createdAt: 'asc' },
    take: WALLETS,
  });

  const wallets = [...existingWallets];
  while (wallets.length < WALLETS) {
    try {
      wallets.push(
        await prisma.wallet.create({ data: { address: fakeSolAddress() } }),
      );
    } catch {}
  }

  console.log('[dev-populate] Wallets ready:', wallets.length);

  // 3) Tickets (1 per wallet max)
  let createdTickets = 0;

  for (let i = 0; i < wallets.length && createdTickets < TICKETS; i++) {
    const w = wallets[i];
    try {
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
    } catch {}
  }

  console.log('[dev-populate] ✅ Tickets created:', createdTickets);

  // 4) Bonus drops
  for (let i = 0; i < BONUS_DROPS; i++) {
    try {
      await prisma.bonusDrop.create({
        data: {
          drawId: draw.id,
          label: `Bonus Drop #${i + 1}`,
          amountXpot: 250,
          scheduledAt: new Date(Date.now() + (i + 1) * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
    } catch {}
  }

  console.log('[dev-populate] ✅ BonusDrops ensured:', BONUS_DROPS);

  // 5) Public entrants
  const demoEntrants = [
    { clerkId: 'dev1', xHandle: 'xpotbet', xName: 'XPOT' },
    { clerkId: 'dev2', xHandle: 'solana', xName: 'Solana' },
    { clerkId: 'dev3', xHandle: 'jup_ag', xName: 'Jupiter' },
    { clerkId: 'dev4', xHandle: 'phantom', xName: 'Phantom' },
  ];

  for (const e of demoEntrants.slice(0, ENTRIES)) {
    try {
      await prisma.drawEntry.create({
        data: {
          drawId: draw.id,
          clerkId: e.clerkId,
          xHandle: e.xHandle,
          xName: e.xName,
        },
      });
    } catch {}
  }

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
