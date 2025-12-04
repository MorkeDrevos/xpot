// app/api/dev/reset-db/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Shared handler for GET / POST
async function handleReset(req: NextRequest) {

  // ✅ HARD BLOCK production domains
  if (!req.nextUrl.hostname.startsWith('dev.')) {
    return NextResponse.json(
      { ok: false, error: 'RESET_DISABLED_IN_PROD' },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset'

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 }
    )
  }

  try {
    // ─────────────────────────────────────
    // 1) NUKE EVERYTHING (safe order)
    // ─────────────────────────────────────
    await prisma.ticket.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.xpUserBalance.deleteMany()
    await prisma.user.deleteMany()
    await prisma.draw.deleteMany()

    // ─────────────────────────────────────
    // 2) CREATE TODAY'S DRAW
    // ─────────────────────────────────────
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    const draw = await prisma.draw.create({
  data: {
    drawDate: new Date(`${todayStr}T00:00:00.000Z`),
    jackpotUsd: 1_000_000,
    isClosed: true,
    resolvedAt: new Date(),
    paidAt: new Date(),
    payoutTx: 'https://solscan.io/tx/FAKE_DEV_TX_HASH'
  }
})

    // ─────────────────────────────────────
    // 3) CREATE USERS
    // ─────────────────────────────────────
    const users = await prisma.user.createMany({
      data: [
        { xHandle: 'dev_whale' },
        { xHandle: 'lucky_gamma' },
        { xHandle: 'airdrop_bandit' }
      ],
    })

    const allUsers = await prisma.user.findMany()

    // ─────────────────────────────────────
    // 4) CREATE WALLETS
    // ─────────────────────────────────────
    const wallets = []

    for (const user of allUsers) {
      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          address: `DEV_${user.xHandle}_${Date.now()}`
        }
      })

      wallets.push(wallet)

      // Give XP
      await prisma.xpUserBalance.create({
        data: {
          walletId: wallet.id,
          balance: Math.floor(Math.random() * 5000) + 100
        }
      })
    }

    // ─────────────────────────────────────
    // 5) CREATE TICKETS
    // ─────────────────────────────────────
    const tickets = []

    for (const wallet of wallets) {
      const ticket = await prisma.ticket.create({
        data: {
          code: `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          walletId: wallet.id,
          userId: wallet.userId,
          drawId: draw.id,
          status: 'IN_DRAW'
        }
      })

      tickets.push(ticket)
    }

    // ─────────────────────────────────────
    // 6) PICK WINNER
    // ─────────────────────────────────────
    const winner = tickets[Math.floor(Math.random() * tickets.length)]

    await prisma.ticket.update({
      where: { id: winner.id },
      data: { status: 'WON' }
    })

    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        winnerTicketId: winner.id
      }
    })

    return NextResponse.json({
      ok: true,
      cleared: true,
      seeded: true,
      users: allUsers.length,
      wallets: wallets.length,
      tickets: tickets.length,
      winnerTicketId: winner.id,
      drawId: draw.id,
    })

  } catch (err) {
    console.error('DEV_RESET_ERROR', err)

    return NextResponse.json({
      ok: false,
      error: 'RESET_FAILED',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}


// ✅ Allow browser use
export const GET = handleReset
export const POST = handleReset
