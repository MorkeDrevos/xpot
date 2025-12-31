// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/api/admin(.*)',
  '/api/internal(.*)',
  // (optional) keep /api/ops protected if you want, since it requires admin key anyway
  // '/api/ops(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/api/(.*)',
  ],
};
