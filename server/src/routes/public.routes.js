import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { formLimiter } from '../middleware/rateLimit.js';
import {
  contactSchema,
  getEvent,
  getSite,
  listAchievements,
  listEvents,
  listFaqs,
  listGallery,
  listPublicAnnouncements,
  listTeam,
  listWings,
  submitContact,
} from '../controllers/public.controller.js';

const router = Router();

const eventsQuerySchema = z.object({
  filter: z.enum(['upcoming', 'past', 'all']).optional().default('upcoming'),
  category: z.enum(['flagship', 'competition', 'workshop', 'cultural', 'meetup']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const achievementsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

router.get('/site', getSite);
router.get('/wings', listWings);
router.get('/events', validate(eventsQuerySchema, 'query'), listEvents);
router.get('/events/:slug', optionalAuth, getEvent);
router.get('/achievements', validate(achievementsQuerySchema, 'query'), listAchievements);
router.get('/gallery', listGallery);
router.get('/team', listTeam);
router.get('/faqs', listFaqs);
router.get('/announcements', listPublicAnnouncements);
router.post('/contact', formLimiter, validate(contactSchema), submitContact);

export default router;
