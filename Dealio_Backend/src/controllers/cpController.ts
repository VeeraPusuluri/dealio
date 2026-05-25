import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { channelManager } from '../services/channelManager';

// In-memory OTP store for phone verification (dev-only)
const phoneOtpStore: Record<string, { otp: string; expiresAt: number }> = {};

export const cpController = {
  // ── Contacts ──────────────────────────────────────────────────────────

  getContacts: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const cp = await prisma.channelPartner.findUnique({ where: { userId: cpUserId } });
    if (!cp) return res.json({ ok: true, data: [] });

    const contacts = await prisma.cPContact.findMany({
      where: { cpId: cp.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ok: true, data: contacts });
  },

  addContact: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const { name, phone, email, notes, tags } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ ok: false, message: 'Name and phone are required' });
    }

    let cp = await prisma.channelPartner.findUnique({ where: { userId: cpUserId } });
    if (!cp) {
      cp = await prisma.channelPartner.create({ data: { userId: cpUserId } });
    }

    const contact = await prisma.cPContact.create({
      data: { cpId: cp.id, name: name.trim(), phone: phone.trim(), email: email?.trim() || null, notes: notes?.trim() || null, tags: tags?.trim() || null },
    });
    res.json({ ok: true, data: contact });
  },

  updateContact: async (req: Request, res: Response) => {
    const contactId = Number(req.params.contactId);
    const { name, phone, email, notes, tags } = req.body;

    const contact = await prisma.cPContact.update({
      where: { id: contactId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(tags !== undefined && { tags: tags?.trim() || null }),
      },
    });
    res.json({ ok: true, data: contact });
  },

  deleteContact: async (req: Request, res: Response) => {
    const contactId = Number(req.params.contactId);
    await prisma.cPContact.delete({ where: { id: contactId } });
    res.json({ ok: true });
  },

  // ── Profile ───────────────────────────────────────────────────────────

  getProfile: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const user = await prisma.user.findUnique({
      where: { id: cpUserId },
      include: { channelPartner: true },
    });
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    res.json({
      ok: true,
      data: {
        id:       user.id,
        fullName: user.fullName,
        email:    user.email,
        phone:    user.phone,
        cp:       user.channelPartner,
      },
    });
  },

  updateProfile: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const { fullName, email, city, bio, reraNumber } = req.body;

    try {
      if (fullName !== undefined || email !== undefined) {
        await prisma.user.update({
          where: { id: cpUserId },
          data: {
            ...(fullName !== undefined && { fullName: fullName?.trim() || null }),
            ...(email !== undefined && { email: email?.trim() || null }),
          },
        });
      }

      let cp = await prisma.channelPartner.findUnique({ where: { userId: cpUserId } });
      if (!cp) {
        cp = await prisma.channelPartner.create({
          data: { userId: cpUserId, city: city?.trim() || null, bio: bio?.trim() || null, reraNumber: reraNumber?.trim() || null },
        });
      } else {
        cp = await prisma.channelPartner.update({
          where: { userId: cpUserId },
          data: {
            ...(city !== undefined && { city: city?.trim() || null }),
            ...(bio !== undefined && { bio: bio?.trim() || null }),
            ...(reraNumber !== undefined && { reraNumber: reraNumber?.trim() || null }),
          },
        });
      }

      const user = await prisma.user.findUnique({ where: { id: cpUserId }, include: { channelPartner: true } });
      res.json({ ok: true, data: { id: user!.id, fullName: user!.fullName, email: user!.email, phone: user!.phone, cp: user!.channelPartner } });
    } catch (err: any) {
      if (err?.code === 'P2002') return res.status(400).json({ ok: false, message: 'Email already in use' });
      res.status(500).json({ ok: false, message: 'Failed to update profile' });
    }
  },

  // ── Phone verification ─────────────────────────────────────────────────

  sendPhoneOtp: async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone?.trim()) return res.status(400).json({ ok: false, message: 'Phone is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    phoneOtpStore[phone.trim()] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    console.log(`[CP Phone Verify] phone=${phone.trim()} OTP=${otp}`);
    res.json({ ok: true, data: { message: 'OTP sent to your phone' } });
  },

  verifyPhone: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const { phone, otp } = req.body;

    const stored = phoneOtpStore[phone?.trim()];
    if (!stored || stored.otp !== otp?.trim() || Date.now() > stored.expiresAt) {
      return res.status(400).json({ ok: false, message: 'Invalid or expired OTP' });
    }
    delete phoneOtpStore[phone.trim()];

    let cp = await prisma.channelPartner.findUnique({ where: { userId: cpUserId } });
    if (!cp) cp = await prisma.channelPartner.create({ data: { userId: cpUserId, phoneVerified: true } });
    else cp = await prisma.channelPartner.update({ where: { userId: cpUserId }, data: { phoneVerified: true } });

    res.json({ ok: true, data: { phoneVerified: true } });
  },

  // ── SSE notification stream ───────────────────────────────────────────

  streamNotifications: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const channelKey = `user:${userId}`;
    channelManager.subscribe(channelKey, userId, res);

    res.write(`data: ${JSON.stringify({
      type: 'connected', title: '', message: 'Notification stream connected',
      city: '', timestamp: new Date().toISOString(),
    })}\n\n`);

    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { clearInterval(heartbeat); }
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      channelManager.unsubscribe(channelKey, userId);
    });
  },

  // ── Fetch and drain unread notifications from DB ──────────────────────

  getNotifications: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    if (notifications.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notifications.map(n => n.id) } },
        data: { read: true },
      });
    }
    res.json({ ok: true, data: notifications });
  },

  // ── Document upload ────────────────────────────────────────────────────

  uploadDocument: async (req: Request, res: Response) => {
    const cpUserId = Number(req.params.cpUserId);
    const { docType } = req.body;
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });

    const validDocTypes = ['aadhaar', 'pan', 'rera'];
    if (!validDocTypes.includes(docType)) {
      return res.status(400).json({ ok: false, message: 'docType must be aadhaar, pan, or rera' });
    }

    const fileUrl = `/uploads/cp-docs/${req.file.filename}`;
    const updateData: Record<string, string | boolean> = {};
    if (docType === 'aadhaar') { updateData.aadhaarUrl = fileUrl; updateData.aadhaarVerified = false; }
    if (docType === 'pan')     { updateData.panUrl = fileUrl;     updateData.panVerified = false; }
    if (docType === 'rera')    { updateData.reraUrl = fileUrl;    updateData.reraVerified = false; }

    let cp = await prisma.channelPartner.findUnique({ where: { userId: cpUserId } });
    if (!cp) cp = await prisma.channelPartner.create({ data: { userId: cpUserId, ...updateData } });
    else cp = await prisma.channelPartner.update({ where: { userId: cpUserId }, data: updateData });

    res.json({ ok: true, data: { url: fileUrl, docType, cp } });
  },
};