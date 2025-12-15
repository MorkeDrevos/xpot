// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/ops(.*)',
  '/api/admin(.*)',
  '/api/internal(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // ✅ Only protect ops/admin/internal
  if (isProtectedRoute(req)) auth.protect();

  // ✅ /hub is intentionally public (HubLockOverlay handles gating client-side)
});

export const config = {
  matcher: [
    // Run on all pages except Next internals + static files
    '/((?!_next|.*\\..*).*)',
    // Always run on API routes
    '/api(.*)',
  ],
};
