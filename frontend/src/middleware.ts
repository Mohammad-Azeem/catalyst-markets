/*
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.44:3000
- Environments: .env.local

✓ Starting...
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
✓ Ready in 1100ms
*/


import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are protected (require auth)
const isProtectedRoute = createRouteMatcher([
  '/portfolio(.*)',
  '/watchlist(.*)',
  '/alerts(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that match isProtectedRoute
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

