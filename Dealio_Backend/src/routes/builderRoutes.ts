import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { builderController } from '../controllers/builderController';
import { requireAuth } from '../middleware/auth';

const imageUploadDir = path.join(process.cwd(), 'uploads', 'project-images');
const docUploadDir   = path.join(process.cwd(), 'uploads', 'project-docs');
if (!fs.existsSync(imageUploadDir)) fs.mkdirSync(imageUploadDir, { recursive: true });
if (!fs.existsSync(docUploadDir))   fs.mkdirSync(docUploadDir,   { recursive: true });

const uniqueName = (_req: any, file: Express.Multer.File, cb: (e: Error | null, name: string) => void) => {
  const ext = path.extname(file.originalname);
  cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
};

const upload = multer({
  storage: multer.diskStorage({ destination: (_r, _f, cb) => cb(null, imageUploadDir), filename: uniqueName }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const uploadDoc = multer({
  storage: multer.diskStorage({ destination: (_r, _f, cb) => cb(null, docUploadDir), filename: uniqueName }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

const router = Router();

// Static routes MUST come before parameterised ones to avoid /:builderId swallowing them
router.post('/ensure', builderController.ensureBuilder);
router.get('/projects', builderController.getPublicProjects);
router.get('/builders', builderController.getPublicBuilders);

// Builder notifications
router.get('/notifications/stream', requireAuth, builderController.streamNotifications);  // SSE
router.get('/notifications', requireAuth, builderController.getBuilderNotifications);

// Customer-facing meeting booking (static — must be before /:builderId)
router.post('/customer/meetings', builderController.bookMeeting);
router.get('/customer/meetings', builderController.getMeetings);

// Parameterised builder routes
router.post('/:builderId/projects', builderController.createProject);
router.get('/:builderId/projects', builderController.getProjects);
router.get('/:builderId/projects/:projectId', builderController.getProject);
router.get('/:builderId/projects/:projectId/pdf', builderController.getProjectPdf);
router.patch('/:builderId/projects/:projectId', builderController.updateProject);
router.post('/:builderId/projects/:projectId/image', requireAuth, upload.single('file'), builderController.uploadProjectImage);
router.get('/:builderId/projects/:projectId/documents', builderController.getDocuments);
router.post('/:builderId/projects/:projectId/documents', requireAuth, uploadDoc.single('file'), builderController.uploadDocument);
router.get('/:builderId/meetings', builderController.getBuilderMeetings);
router.patch('/:builderId/meetings/:meetingId', builderController.updateMeetingStatus);
router.get('/:builderId/deals', builderController.getBuilderDeals);
router.patch('/:builderId/deals/:dealId/status', requireAuth, builderController.updateDealStatus);
router.get('/:builderId/leads', requireAuth, builderController.getBuilderLeads);
router.patch('/:builderId/leads/:dealId/stage', requireAuth, builderController.updateLeadStage);
router.get('/:builderId/commissions', requireAuth, builderController.getBuilderCommissions);
router.patch('/:builderId/commissions/:dealId/release', requireAuth, builderController.releaseBuilderCommission);

export default router;