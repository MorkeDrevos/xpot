import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset'

  if (secret !== expected) {
    return NextResponse.json({ ok: false, error: 'BAD_SECRET' }, { status: 401 })
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_RESET !== '1') {
    return NextResponse.json({ ok: false, error: 'SEED_DISABLED_IN_PROD' }, { status: 403 })
  }

  try {
    const now = new Date()

    const today = new Date(now)
    today.setHours(12, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)

    // ───────── TODAY DRAW (EMPTY) ─────────
    const todayDraw = await prisma.draw.create({
      data: {
        drawDate: today,
        jackpotUsd: 10_000,
        rolloverUsd: 0,
      },
    })

    // ───────── YESTERDAY (WINNER) ─────────
    const yesterdayDraw = await prisma.draw.create({
      data: {
        drawDate: yesterday,
        jackpotUsd: 10_000,
        rolloverUsd: 0,
      },
    })

    const wallet1 = '9uuq6Uch7nEXAMPLEWALLET11111111111111111'
    const wallet2 = '9uuq6Uch7nEXAMPLEWALLET22222222222222222'

    const winner = await prisma.ticket.create({
      data: {
        drawId: yesterdayDraw.id,
        code: 'XPOT-ABC-123',
        walletAddress: wallet1,
        label: 'Yesterday’s draw',
        jackpotUsd: 10_000,
        status: 'won',
      },
    })

    await prisma.ticket.createMany({
      data: [
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-DEF-456',
          walletAddress: wallet2,
          label: 'Yesterday’s draw',
          jackpotUsd: 10_000,
          status: 'not-picked',
        },
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-GHI-789',
          walletAddress: wallet2,
          label: 'Yesterday’s draw',
          jackpotUsd: 10_000,
          status: 'expired',
        },
      ],
    })

    await prisma.draw.update({
      where: { id: yesterdayDraw.id },
      data: { winningTicketId: winner.id },
    })

    // ───────── TWO DAYS AGO (ROLLOVER) ─────────
    const oldDraw = await prisma.draw.create({
      data: {
        drawDate: twoDaysAgo,
        jackpotUsd: 5_000,
        rolloverUsd: 5_000,
      },
    })

    await prisma.ticket.createMany({
      data: [
        {
          drawId: oldDraw.id,
          code: 'XPOT-JKL-111',
          walletAddress: wallet1,
          label: 'Early XPOT draw',
          jackpotUsd: 5_000,
          status: 'claimed',
        },
        {
          drawId: oldDraw.id,
          code: 'XPOT-MNO-222',
          walletAddress: wallet2,
          label: 'Early XPOT draw',
          jackpotUsd: 5_000,
          status: 'not-picked',
        },
      ],
    })

    return NextResponse.json({
      ok: true,
      draws: {
        today: todayDraw.id,
        yesterday: yesterdayDraw.id,
        twoDaysAgo: oldDraw.id,
      },
    })
  } catch (err) {
    console.error('[XPOT] Seed failed:', err)
    return NextResponse.json({ ok: false, error: 'SEED_FAILED' }, { status: 500 })
  }
}
