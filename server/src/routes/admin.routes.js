import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireApproved, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { decideApplication, reviewSchema } from '../controllers/auth.controller.js';
import {
  changeRole,
  getAuditLogs,
  getMember,
  getStats,
  listApplications,
  listMembers,
  reinstateMember,
  removeMember,
  suspendMember,
} from '../controllers/admin.controller.js';
import {
  createContent,
  deleteContent,
  getContentItem,
  getSettings,
  listContent,
  toggleMembership,
  updateContent,
  updateSettings,
} from '../controllers/content.controller.js';
import { listEventRegistrations, scanPass } from '../controllers/registration.controller.js';

const router = Router();

router.use(authenticate, requireApproved, requireRole('president', 'faculty_coordinator'));

router.get('/stats', getStats);
router.get('/applications', listApplications);
router.post('/applications/:id/president', validate(reviewSchema), decideApplication('president'));
router.post('/applications/:id/faculty', validate(reviewSchema), decideApplication('faculty'));

router.get('/members', listMembers);
router.get('/members/:id', getMember);
router.patch('/members/:id/role', validate(z.object({ role: z.string() })), changeRole);
router.post(
  '/members/:id/suspend',
  validate(z.object({ reason: z.string().trim().min(5).max(500) })),
  suspendMember,
);
router.post('/members/:id/reinstate', reinstateMember);
router.delete(
  '/members/:id',
  validate(z.object({ reason: z.string().trim().min(5).max(500) })),
  removeMember,
);

router.get('/audit-logs', getAuditLogs);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.post('/settings/membership-toggle', toggleMembership);

router.get('/content/:entity', listContent);
router.get('/content/:entity/:id', getContentItem);
router.post('/content/:entity', createContent);
router.patch('/content/:entity/:id', updateContent);
router.delete('/content/:entity/:id', deleteContent);

router.post('/scan', validate(z.object({ passCode: z.string().trim().min(3).max(40) })), scanPass);
router.get('/events/:id/registrations', listEventRegistrations);

export default router;
