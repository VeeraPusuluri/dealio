import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { cpController } from '../controllers/cpController';
import { requireAuth } from '../middleware/auth';

const cpDocDir = path.join(process.cwd(), 'uploads', 'cp-docs');
if (!fs.existsSync(cpDocDir)) fs.mkdirSync(cpDocDir, { recursive: true });

const uniqueName = (_req: any, file: Express.Multer.File, cb: (e: Error | null, name: string) => void) => {
  const ext = path.extname(file.originalname);
  cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
};

const uploadDoc = multer({
  storage: multer.diskStorage({ destination: (_r, _f, cb) => cb(null, cpDocDir), filename: uniqueName }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

const router = Router();

// Contacts
router.get('/:cpUserId/contacts', requireAuth, cpController.getContacts);
router.post('/:cpUserId/contacts', requireAuth, cpController.addContact);
router.patch('/:cpUserId/contacts/:contactId', requireAuth, cpController.updateContact);
router.delete('/:cpUserId/contacts/:contactId', requireAuth, cpController.deleteContact);

// Profile
router.get('/:cpUserId/profile', requireAuth, cpController.getProfile);
router.patch('/:cpUserId/profile', requireAuth, cpController.updateProfile);

// Notifications — static paths before /:cpUserId to avoid param collision
router.get('/notifications/stream', requireAuth, cpController.streamNotifications);  // SSE
router.get('/notifications',        requireAuth, cpController.getNotifications);

// Phone verification
router.post('/verify-phone/send-otp', requireAuth, cpController.sendPhoneOtp);
router.post('/:cpUserId/verify-phone', requireAuth, cpController.verifyPhone);

// Document upload
router.post('/:cpUserId/documents', requireAuth, uploadDoc.single('file'), cpController.uploadDocument);

export default router;