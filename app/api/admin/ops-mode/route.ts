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

function computeEffectiveMode(mode: 'MANUAL' | 'AUTO') {
  const allowed = envAutoAllowed();
  const effectiveMode: 'MANUAL' | 'AUTO' = allowed && mode === 'AUTO' ? 'AUTO' : 'MANUAL';
  return { allowed, effectiveMode };
}

// GET: show current mode + env lock + effective mode
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const cfg = await getConfig();
    const { allowed, effectiveMode } = computeEffectiveMode(cfg.mode as 'MANUAL' | 'AUTO');

    return NextResponse.json({
      ok: true,
      mode: cfg.mode,
      envAutoAllowed: allowed,
      effectiveMode,
      updatedAt: cfg.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[ops-mode][GET] error', err);
    return NextResponse.json(
      { ok: false, error: 'OPS_MODE_GET_FAILED', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}

// POST: set requested mode (ALWAYS allow saving AUTO, even when env is locked)
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: string };

    const mode = String(body.mode ?? '').toUpperCase();
    if (mode !== 'MANUAL' && mode !== 'AUTO') {
      return NextResponse.json({ ok: false, error: 'INVALID_MODE' }, { status: 400 });
    }

    const updated = await prisma.opsConfig.upsert({
      where: { singleton: 'singleton' },
      update: { mode },
      create: { singleton: 'singleton', mode },
      select: { mode: true, updatedAt: true },
    });

    const { allowed, effectiveMode } = computeEffectiveMode(updated.mode as 'MANUAL' | 'AUTO');

    return NextResponse.json({
      ok: true,
      mode: updated.mode,          // requested mode (DB)
      envAutoAllowed: allowed,     // env lock flag
      effectiveMode,               // actual runtime mode
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: any) {
    console.error('[ops-mode][POST] error', err);
    return NextResponse.json(
      { ok: false, error: 'OPS_MODE_SAVE_FAILED', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
