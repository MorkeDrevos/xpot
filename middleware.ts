// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',                 // public landing
  '/hub(.*)',          // ✅ allow hub to render (we lock it in the UI)
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware((auth, req) => {
  // Protect everything except the public routes above
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  matcher: [
    // App pages (exclude _next + static files)
    '/((?!.+\\.[\\w]+$|_next).*)',
    // Always run for API routes too
    '/(api|trpc)(.*)',
  ],
};
