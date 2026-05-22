import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { authService } from '../services/authService';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dealio-secret-key-12345';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  || process.env.VITE_GOOGLE_CLIENT_ID
  || '1013744675613-5spva6h3eflij6vvofvjor875iiq9s63.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const authController = {
  loginSendOtp: async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = authService.sendOtp(phone);
    res.json({ ok: true, data: result });
  },

  loginVerifyOtp: async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    if (result.success) {
      res.json({ ok: true, data: result.data });
    } else {
      res.status(400).json({ ok: false, message: result.message });
    }
  },

  signupSendOtp: async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = authService.sendOtp(phone);
    res.json({ ok: true, data: result });
  },

  signupVerifyOtp: async (req: Request, res: Response) => {
    const { phone, otp, fullName, role } = req.body;
    const result = await authService.verifyOtp(phone, otp, { fullName, role });
    if (result.success) {
      res.json({ ok: true, data: result.data });
    } else {
      res.status(400).json({ ok: false, message: result.message });
    }
  },

  googleAuth: async (req: Request, res: Response) => {
    console.log('[googleAuth] hit — body keys:', Object.keys(req.body));
    const { idToken, role } = req.body;

    if (!idToken) {
      res.status(400).json({ ok: false, message: 'Google ID token is required' });
      return;
    }

    let googleEmail: string;
    let googleName: string;
    let googleSub: string;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const p = ticket.getPayload();
      if (!p || !p.email) throw new Error('Empty token payload');
      googleEmail = p.email;
      googleName  = (p.name || p.email.split('@')[0]) as string;
      googleSub   = (p.sub  || String(Date.now())) as string;
    } catch (err) {
      console.error('[googleAuth] token verification failed:', err);
      res.status(401).json({ ok: false, message: 'Invalid Google token', detail: err instanceof Error ? err.message : String(err) });
      return;
    }

    const normalizedRole = (role || 'CUSTOMER').toUpperCase();
    console.log('[googleAuth] verified email:', googleEmail, 'role:', normalizedRole);

    try {
      // Find or create user by email
      let user = await prisma.user.findUnique({ where: { email: googleEmail } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email:    googleEmail,
            fullName: googleName,
            phone:    `google-${googleSub}`,   // placeholder — phone required by schema
            role:     normalizedRole,
          },
        });

        // Auto-create Builder profile if needed
        if (user.role === 'BUILDER') {
          await prisma.builder.create({ data: { userId: user.id } });
        }
      } else if (role) {
        // Update role on explicit signup
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: normalizedRole },
        });
      }

      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role, name: user.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('[googleAuth] success for user id:', user.id);
      res.json({
        ok: true,
        data: {
          accessToken: token,
          refreshToken: token,
          expiresIn: 7 * 24 * 60 * 60,
          user: {
            id:       user.id,
            fullName: user.fullName ?? googleName,
            email:    user.email,
            phone:    user.phone,
            role:     user.role,
          },
        },
      });
    } catch (dbErr) {
      console.error('[googleAuth] DB error:', dbErr);
      res.status(500).json({ ok: false, message: 'Internal server error during Google sign-in' });
    }
  },
};