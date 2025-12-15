// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/ops(.*)',
  '/api/admin(.*)',
  '/api/internal(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // IMPORTANT: do NOT protect /hub here (your HubLockOverlay handles gating)
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run middleware on all routes except Next.js internals + static files
    '/((?!_next|.*\\..*).*)',
    // Always run for API routes
    '/api/(.*)',
  ],
};
