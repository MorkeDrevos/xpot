// app/api/dev/seed-demo/route.ts
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
      },
    })

    // ───────── YESTERDAY (WINNER) ─────────
    const yesterdayDraw = await prisma.draw.create({
      data: {
        drawDate: yesterday,
      },
    })

    const wallet1 = '9uuq6Uch7nEXAMPLEWALLET11111111111111111'
    const wallet2 = '9uuq6Uch7nEXAMPLEWALLET22222222222222222'

    // Winner ticket for yesterday
    const winner = await prisma.ticket.create({
      data: {
        drawId: yesterdayDraw.id,
        code: 'XPOT-ABC-123',
        walletAddress: wallet1,
        label: "Yesterday's draw",
        status: 'won',
      },
    })

    // Extra tickets for yesterday
    await prisma.ticket.createMany({
      data: [
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-DEF-456',
          walletAddress: wallet2,
          label: "Yesterday's draw",
          status: 'not-picked',
        },
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-GHI-789',
          walletAddress: wallet2,
          label: "Yesterday's draw",
          status: 'expired',
        },
      ],
    })

    // Mark winner on the draw (only if winningTicketId exists in your schema)
    await prisma.draw.update({
      where: { id: yesterdayDraw.id },
      data: { winningTicketId: winner.id },
    })

    // ───────── TWO DAYS AGO (ROLLOVER-STYLE HISTORY) ─────────
    const oldDraw = await prisma.draw.create({
      data: {
        drawDate: twoDaysAgo,
      },
    })

    await prisma.ticket.createMany({
      data: [
        {
          drawId: oldDraw.id,
          code: 'XPOT-JKL-111',
          walletAddress: wallet1,
          label: 'Early XPOT draw',
          status: 'claimed',
        },
        {
          drawId: oldDraw.id,
          code: 'XPOT-MNO-222',
          walletAddress: wallet2,
          label: 'Early XPOT draw',
          status: 'not-picked',
        },
      ],
    })

    return NextResponse.json(
      {
        ok: true,
        draws: {
          today: todayDraw.id,
          yesterday: yesterdayDraw.id,
          twoDaysAgo: oldDraw.id,
        },
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[XPOT] Seed failed:', err)
    return NextResponse.json({ ok: false, error: 'SEED_FAILED' }, { status: 500 })
  }
}
