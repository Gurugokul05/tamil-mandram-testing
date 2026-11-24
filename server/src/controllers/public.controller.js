import { z } from 'zod';
import {
  Achievement,
  Announcement,
  ContactMessage,
  Event,
  Faq,
  Registration,
  SiteSetting,
  TeamMember,
  User,
  Wing,
} from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const publishedEventFilter = { isPublished: true };

const withRegistrationCounts = async (events) => {
  if (!events.length) return [];

  const counts = await Registration.aggregate([
    {
      $match: {
        event: { $in: events.map((event) => event._id) },
        status: { $in: ['registered', 'attended'] },
      },
    },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);

  const countByEvent = new Map(counts.map((row) => [String(row._id), row.count]));

  return events.map((event) => ({
    ...event.toJSON(),
    registrationCount: countByEvent.get(String(event._id)) || 0,
  }));
};

export const getSite = asyncHandler(async (_req, res) => {
  const [settings, memberCount, eventCount, achievementCount, wings] = await Promise.all([
    SiteSetting.findOne({ key: 'main' }).lean(),
    User.countDocuments({ status: 'approved' }),
    Event.countDocuments(publishedEventFilter),
    Achievement.countDocuments({ isPublished: true }),
    Wing.countDocuments({ isActive: true }),
  ]);

  const stats = [
    { key: 'members', value: memberCount, suffix: '+' },
    { key: 'events', value: eventCount, suffix: '' },
    { key: 'achievements', value: achievementCount, suffix: '' },
    { key: 'wings', value: wings, suffix: '' },
  ];

  const site = { ...(settings || {}) };
  if (site._id) {
    site.id = String(site._id);
    delete site._id;
  }

  res.json({ success: true, data: { ...site, stats } });
});

export const listWings = asyncHandler(async (_req, res) => {
  const wings = await Wing.find({ isActive: true }).sort({ order: 1, name: 1 });
  res.json({ success: true, data: wings });
});

export const listEvents = asyncHandler(async (req, res) => {
  const { filter, limit, category } = req.query;
  const now = new Date();

  const query = { ...publishedEventFilter };
  if (category) query.category = category;

  if (filter === 'upcoming') {
    query.startDate = { $gte: now };
  } else if (filter === 'past') {
    query.startDate = { $lt: now };
  }

  const sort = filter === 'past' ? { startDate: -1 } : { startDate: 1 };
  const events = await Event.find(query).sort(sort).limit(limit);
  const data = await withRegistrationCounts(events);

  res.json({ success: true, data });
});

export const getEvent = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const isObjectId = /^[a-f\d]{24}$/i.test(slug);

  const event = await Event.findOne({
    ...publishedEventFilter,
    ...(isObjectId ? { _id: slug } : { slug }),
  });

  if (!event) throw ApiError.notFound('That event could not be found');

  const registrations = await Registration.countDocuments({
    event: event._id,
    status: { $in: ['registered', 'attended'] },
  });

  const isMember = req.user?.status === 'approved';
  const payload = {
    ...event.toJSON(),
    registrationCount: registrations,
    spotsLeft: event.capacity > 0 ? Math.max(event.capacity - registrations, 0) : null,
  };

  if (!isMember) delete payload.memberOnlyInfo;

  res.json({ success: true, data: payload });
});

export const listAchievements = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const query = { isPublished: true };
  if (year) query.year = Number(year);

  const achievements = await Achievement.find(query).sort({ year: -1, order: 1 });
  res.json({ success: true, data: achievements });
});

export const listGallery = asyncHandler(async (_req, res) => {
  const hasImage = { $exists: true, $nin: [null, ''] };

  const [achievements, events] = await Promise.all([
    Achievement.find({ isPublished: true, 'photo.url': hasImage }).sort({ year: -1 }),
    Event.find({ ...publishedEventFilter, 'poster.url': hasImage }).sort({ startDate: -1 }),
  ]);

  const data = [
    ...achievements.map((item) => ({
      id: `achievement-${item._id}`,
      title: item.title,
      year: item.year,
      image: item.photo.url,
      alt: item.photo.alt || item.title?.en || item.title?.ta || '',
      source: 'achievement',
      category: item.category,
    })),
    ...events.map((item) => ({
      id: `event-${item._id}`,
      title: item.title,
      year: new Date(item.startDate).getFullYear(),
      image: item.poster.url,
      alt: item.poster.alt || item.title?.en || item.title?.ta || '',
      source: 'event',
      category: item.category,
      slug: item.slug,
    })),
  ];

  res.json({ success: true, data });
});

export const listTeam = asyncHandler(async (_req, res) => {
  const team = await TeamMember.find({ isActive: true }).sort({ group: 1, order: 1 });
  res.json({ success: true, data: team });
});

export const listFaqs = asyncHandler(async (_req, res) => {
  const faqs = await Faq.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: faqs });
});

export const listPublicAnnouncements = asyncHandler(async (_req, res) => {
  const now = new Date();
  const announcements = await Announcement.find({
    isPublished: true,
    audience: 'public',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ isPinned: -1, publishedAt: -1 })
    .limit(10);

  res.json({ success: true, data: announcements });
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]{0,20}$/, 'Enter a valid phone number')
    .optional()
    .default(''),
  subject: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
});

export const submitContact = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create({
    ...req.body,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Thank you. The Mandram team will get back to you soon.',
    data: { id: message.id },
  });
});
