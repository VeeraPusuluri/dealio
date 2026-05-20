import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dealio-secret-key-12345';

// Mock DB for demonstration
export const users: any[] = [];
export const otps: Record<string, string> = {}; // phone -> otp

export const authService = {
  sendOtp: (phone: string) => {
    const otp = '123456'; // Constant OTP for testing as requested/implied by "mock"
    otps[phone] = otp;
    console.log(`[AuthService] OTP for ${phone}: ${otp}`);
    return { success: true, message: 'OTP sent' };
  },

  verifyOtp: async (phone: string, otp: string, userData?: { fullName?: string; role?: string }) => {
    if (otps[phone] === otp) {
      delete otps[phone];
      
      let user = await prisma.user.findUnique({
        where: { phone }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone,
            fullName: userData?.fullName || 'User ' + phone.slice(-4),
            role: userData?.role || 'CUSTOMER',
          }
        });
        
        // If role is BUILDER, also create a Builder record
        if (user.role === 'BUILDER') {
          await prisma.builder.create({
            data: {
              userId: user.id
            }
          });
        }
      } else if (userData?.fullName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName: userData.fullName,
            role: userData.role || user.role
          }
        });
      }

      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role, name: user.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          accessToken: token,
          refreshToken: token,
          expiresIn: 7 * 24 * 60 * 60,
          user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            email: user.email
          }
        }
      };
    }
    return { success: false, message: 'Invalid OTP' };
  }
};
