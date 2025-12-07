import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = 'https://frontend-api.clerk.services' + url.pathname.replace('/__clerk', '');
  
  const res = await fetch(target, {
    headers: req.headers,
    method: 'GET',
  });

  return new Response(res.body, {
    headers: res.headers,
    status: res.status,
  });
}
