import { Request, Response } from 'express';
import { authService } from '../services/authService';

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
  }
};
