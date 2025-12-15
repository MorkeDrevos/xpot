// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // add any truly public pages here (optional)
  // '/privacy',
  // '/terms',
]);

export default clerkMiddleware((auth, req) => {
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
