export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function envAutoAllowed() {
  return (process.env.XPOT_AUTO_DRAW_ENABLED ?? '') === 'true';
}

async function getConfig() {
  return prisma.opsConfig.upsert({
    where: { singleton: 'singleton' },
    update: {},
    create: { singleton: 'singleton', mode: 'MANUAL' },
    select: { mode: true, updatedAt: true },
  });
}

// GET: show current mode + whether env even allows auto
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const cfg = await getConfig();

  return NextResponse.json({
    ok: true,
    mode: cfg.mode, // MANUAL | AUTO
    envAutoAllowed: envAutoAllowed(),
    effectiveMode: envAutoAllowed() && cfg.mode === 'AUTO' ? 'AUTO' : 'MANUAL',
    updatedAt: cfg.updatedAt.toISOString(),
  });
}

// POST: set mode (requires admin key via requireAdmin)
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as { mode?: string };

  const mode = String(body.mode ?? '').toUpperCase();
  if (mode !== 'MANUAL' && mode !== 'AUTO') {
    return NextResponse.json({ ok: false, error: 'INVALID_MODE' }, { status: 400 });
  }

  // Safety: you may choose to block switching to AUTO if env doesn't allow it
  if (mode === 'AUTO' && !envAutoAllowed()) {
    return NextResponse.json(
      { ok: false, error: 'AUTO_NOT_ALLOWED_IN_THIS_ENV' },
      { status: 400 },
    );
  }

  const updated = await prisma.opsConfig.upsert({
    where: { singleton: 'singleton' },
    update: { mode },
    create: { singleton: 'singleton', mode },
    select: { mode: true, updatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    mode: updated.mode,
    envAutoAllowed: envAutoAllowed(),
    effectiveMode: envAutoAllowed() && updated.mode === 'AUTO' ? 'AUTO' : 'MANUAL',
    updatedAt: updated.updatedAt.toISOString(),
  });
}
