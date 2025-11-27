import { NextResponse } from 'next/server';

export async function GET() {
  // Vercel auto-injects these in prod
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'local-dev';

  return NextResponse.json({ buildId });
}
