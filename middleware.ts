// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// ✅ Public pages (no forced redirect). Gating happens in the client UI.
const isPublicRoute = createRouteMatcher([
  '/',
  '/hub(.*)', // ✅ allow /hub + /hub/history etc to render with your lock overlay
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// ✅ Routes that MUST be protected server-side
const isProtectedRoute = createRouteMatcher([
  '/ops(.*)',
  '/api/admin(.*)',
  '/api/internal(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect();
  // everything else is public (including /hub)
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
