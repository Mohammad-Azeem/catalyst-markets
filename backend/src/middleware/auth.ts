//1.
import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    const session = await clerkClient.sessions.verifySession(token, token);

    // Verify with Clerk
    //const { userId } = await clerkClient.verifyToken(token, {
    //  secretKey: process.env.CLERK_SECRET_KEY,
    //  issuer: process.env.CLERK_FRONTEND_API,
    //});

    req.userId = session.userId as string;      // changed but maybe incorect
    
    // Gives a failed to fetch error
    // ✅ Decode JWT to get userId (Clerk tokens are signed JWTs)
    //const base64Url = token.split('.')[1];
    //const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    //const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    //req.userId = payload.sub; // sub = subject = userId
    
    return next();
  } catch (error: any) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};


/*
// After 1

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { clerkMiddleware, getAuth } from '@clerk/express';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify with Clerk
    const { userId } = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      issuer: process.env.CLERK_FRONTEND_API,
    });
  

    req.userId = userId as string;
    //req.userId = verified.sub; // Clerk uses 'sub' for userId in the JWT payload;

    return next();
  } catch (error: any) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
*/





/*
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
    return next();
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
*/