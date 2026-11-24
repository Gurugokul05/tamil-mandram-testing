import { Router } from 'express';
import { authenticate, requireApproved } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getOverview,
  listAnnouncements,
  listDirectory,
  listMyRegistrations,
  listNotifications,
  listResources,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/member.controller.js';
import {
  cancelRegistration,
  getPass,
  registerForEvent,
  registerSchema,
} from '../controllers/registration.controller.js';

const router = Router();

router.use(authenticate, requireApproved);

router.get('/overview', getOverview);
router.get('/announcements', listAnnouncements);
router.get('/directory', listDirectory);
router.get('/resources', listResources);
router.get('/registrations', listMyRegistrations);
router.get('/notifications', listNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.post('/notifications/read-all', markAllNotificationsRead);

router.post('/events/:slug/register', validate(registerSchema), registerForEvent);
router.delete('/registrations/:id', cancelRegistration);
router.get('/registrations/:id/pass', getPass);

export default router;
