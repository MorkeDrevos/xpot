// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/ops(.*)',
  '/api/admin(.*)',
  '/api/internal(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // ✅ DO NOT protect /hub here.
  // Hub gating is handled in the client with HubLockOverlay.

  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Run middleware on all routes except Next internals and static files
    '/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|ttf|woff|woff2)$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
