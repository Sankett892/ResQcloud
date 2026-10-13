import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../types/index.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const COOKIE_NAME = 'resqcloud_token';
const isProduction = process.env.NODE_ENV === 'production';
const isCookieSecure = process.env.COOKIE_SECURE === 'true' || isProduction;

const cookieOptions = {
  httpOnly: true,
  secure: isCookieSecure,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default registration is strictly CITIZEN. Rescue operators must be provisioned or seeded.
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'CITIZEN',
      },
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role as any,
      name: newUser.name,
    });

    res.cookie(COOKIE_NAME, token, cookieOptions);

    await prisma.auditLog.create({
      data: {
        actorId: newUser.id,
        action: 'CITIZEN_REGISTRATION',
        entityType: 'User',
        entityId: newUser.id,
        metadata: JSON.stringify({ email: newUser.email }),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Citizen account created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Register Error]', error);
    res.status(500).json({ success: false, error: 'Registration failed due to a server error.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
      return;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    res.cookie(COOKIE_NAME, token, cookieOptions);

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ role: user.role }),
      },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Login Error]', error);
    res.status(500).json({ success: false, error: 'Login failed due to a server error.' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: 'lax',
  });

  if (req.user) {
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
      },
    });
  }

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ success: false, error: 'User account not found.' });
    return;
  }

  res.json({
    success: true,
    user,
  });
};
