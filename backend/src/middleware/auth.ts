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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Clerk (NEW API v5 method)
    try {
      const verified = await clerkClient.verifyToken(token);
      
      // Attach userId to request
      req.userId = verified.sub; // 'sub' contains the user ID
      return next();
    } catch (verifyError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

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