import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    time: new Date().toISOString(),
  });
}
