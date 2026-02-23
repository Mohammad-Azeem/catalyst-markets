# 🚀 V2 PHASE 1: User Authentication — Complete Implementation

## 📋 V2 Breakdown (4 Phases)

**Phase 1: Authentication** (this document) ← START HERE
**Phase 2: Real Prices + Charts** (Yahoo Finance + TradingView)
**Phase 3: Alerts + Screener** (Background jobs + filters)
**Phase 4: News + Social** (RSS feeds + leaderboard)

---

## ✅ PHASE 1: USER AUTHENTICATION

### What We're Building:
- Clerk auth integration (fastest, production-grade)
- Sign up, login, logout
- Protected routes
- JWT token in API requests
- User-specific portfolios & watchlists

### Time Estimate: 3-4 hours

---

## STEP 1: Install Clerk (Frontend)

```bash
cd frontend
npm install @clerk/nextjs
```

---

## STEP 2: Get Clerk Keys

1. Go to https://clerk.com → Sign up (free)
2. Create new application → Choose "Next.js"
3. Copy these keys from Dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

---

## STEP 3: Add to `.env.local` (Frontend)

```bash
# frontend/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (auto-detected, but can override)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## STEP 4: Wrap App with ClerkProvider

**File:** `frontend/src/app/layout.tsx`

```tsx
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Catalyst Markets',
  description: 'NSE & NASDAQ Intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#14d2b4',
          colorBackground: '#07090f',
          colorInputBackground: '#0c1018',
          colorInputText: '#e8edf5',
        },
      }}
    >
      <html lang="en">
        <body style={{ background: 'var(--bg)', minHeight: '100vh' }}>
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

## STEP 5: Create Middleware (Route Protection)

**File:** `frontend/src/middleware.ts` (NEW FILE — create at root of src/)

```typescript
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Public routes (no auth required)
  publicRoutes: ['/', '/stocks', '/stocks/(.*)', '/ipos', '/ipos/(.*)'],

  // Protected routes (require auth)
  // /portfolio, /watchlist, /alerts will require login
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

---

## STEP 6: Create Auth Pages

**File:** `frontend/src/app/sign-in/[[...sign-in]]/page.tsx`

```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <SignIn />
    </div>
  );
}
```

**File:** `frontend/src/app/sign-up/[[...sign-up]]/page.tsx`

```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <SignUp />
    </div>
  );
}
```

---

## STEP 7: Update Navbar with UserButton

**File:** `frontend/src/components/Navbar.tsx`

Replace the "Sign In" button section with:

```tsx
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// ... inside the navbar JSX, replace the Sign In link:

<SignedOut>
  <Link href="/sign-in" className="btn btn-primary btn-sm">
    Sign In
  </Link>
</SignedOut>

<SignedIn>
  <UserButton
    appearance={{
      elements: {
        avatarBox: 'w-8 h-8',
      },
    }}
  />
</SignedIn>
```

---

## STEP 8: Backend — Add Clerk Middleware

```bash
cd backend
npm install @clerk/clerk-sdk-node
```

**File:** `backend/src/middleware/auth.ts` (NEW FILE)

```typescript
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token with Clerk
    const session = await clerkClient.sessions.verifyToken(token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach userId to request
    req.userId = session.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional: Sync Clerk user to local database
export const syncUser = async (userId: string) => {
  const user = await clerkClient.users.getUser(userId);
  
  // TODO: Save to your database
  // await prisma.user.upsert({
  //   where: { clerkId: userId },
  //   create: {
  //     clerkId: userId,
  //     email: user.emailAddresses[0].emailAddress,
  //     name: user.firstName + ' ' + user.lastName,
  //   },
  //   update: {},
  // });
};
```

---

## STEP 9: Update Portfolio Routes (Protected)

**File:** `backend/src/routes/portfolio.ts`

```typescript
import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { portfolioService } from '../services/portfolio';

const router = Router();

// ALL routes now require authentication
router.use(authenticate);

// Get all portfolios for authenticated user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const portfolios = await portfolioService.getUserPortfolios(req.userId!);
    res.json({ data: portfolios });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// ... rest of routes, all using req.userId instead of hardcoded userId
```

---

## STEP 10: Update Frontend API Client (Send Token)

**File:** `frontend/src/lib/api.ts`

Add token to all requests:

```typescript
import { useAuth } from '@clerk/nextjs';

// Update fetchAPI function to include token
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from Clerk (only works in React components)
  // For now, we'll pass token explicitly or use a hook

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    // ... rest unchanged
  }
}

// Create a custom hook for authenticated API calls
export function useAuthenticatedAPI() {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getToken();

    return fetchAPI<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return {
    portfolio: {
      getAll: () => fetchWithAuth('/portfolio'),
      create: (data: any) =>
        fetchWithAuth('/portfolio', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      // ... rest
    },
    watchlist: {
      // ... same pattern
    },
  };
}
```

---

## STEP 11: Update Portfolio Page to Use Auth

**File:** `frontend/src/app/portfolio/page.tsx`

```tsx
'use client';

import { useAuthenticatedAPI } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

export default function PortfolioPage() {
  const { user, isLoaded } = useUser();
  const api = useAuthenticatedAPI();

  useEffect(() => {
    if (isLoaded && user) {
      fetchPortfolios();
    }
  }, [isLoaded, user]);

  const fetchPortfolios = async () => {
    try {
      const res = await api.portfolio.getAll();
      // ... rest
    } catch (error) {
      console.error('Failed to fetch', error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>Please sign in to view portfolios</div>
    );
  }

  // ... rest of component
}
```

---

## STEP 12: Add User Model to Database

**File:** `backend/prisma/schema.prisma`

Add User model and update relations:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  portfolios Portfolio[]
  watchlists Watchlist[]

  @@index([clerkId])
  @@index([email])
}

model Portfolio {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  userId      String   // Changed from Int to String for Clerk ID
  user        User     @relation(fields: [userId], references: [clerkId])
  stocks      PortfolioStock[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

// ... same for Watchlist
```

Run migration:

```bash
cd backend
npx prisma migrate dev --name add_user_auth
npx prisma generate
```

---

## STEP 13: Test Everything

```bash
# Start backend
cd backend && npm run dev

# Start frontend (different terminal)
cd frontend && npm run dev

# Open browser
http://localhost:3000
```

**Test Flow:**
1. Click "Sign In" → Redirects to Clerk modal
2. Create account
3. Go to /portfolio → Should work (authenticated)
4. Sign out → Go to /portfolio → Should redirect to sign-in

---

## ✅ Phase 1 Complete Checklist

- [ ] Clerk installed and configured
- [ ] Sign in/up pages created
- [ ] Middleware protects routes
- [ ] UserButton in Navbar
- [ ] Backend validates JWT tokens
- [ ] Portfolio/Watchlist use real userId
- [ ] Database has User model
- [ ] Can create account and sign in
- [ ] Protected routes redirect to login
- [ ] Each user has their own data

---

## 🎯 What Changed:

**Before:** All users share userId=1 (hardcoded)
**After:** Each user gets own portfolios/watchlists via Clerk ID

**Security:** JWT tokens verified on backend, no userId spoofing possible

**UX:** Seamless login with Clerk's pre-built UI

---

## 📂 Files Created/Modified Summary:

**New Files:**
- `frontend/src/middleware.ts`
- `frontend/src/app/sign-in/[[...sign-in]]/page.tsx`
- `frontend/src/app/sign-up/[[...sign-up]]/page.tsx`
- `backend/src/middleware/auth.ts`

**Modified:**
- `frontend/src/app/layout.tsx` (ClerkProvider)
- `frontend/src/components/Navbar.tsx` (UserButton)
- `frontend/src/lib/api.ts` (token in headers)
- `backend/src/routes/portfolio.ts` (use req.userId)
- `backend/src/routes/watchlist.ts` (use req.userId)
- `backend/prisma/schema.prisma` (User model)

---

**NEXT:** Phase 2 (Real Prices + Charts) — I'll provide complete code for that next!
