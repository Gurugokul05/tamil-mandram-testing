import { Announcement, Notification, Registration, Resource, User } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const pageParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const getOverview = asyncHandler(async (req, res) => {
  const now = new Date();

  const [announcements, registrations, unread, memberCount, resources] = await Promise.all([
    Announcement.find({
      isPublished: true,
      audience: { $in: ['members', 'public'] },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(5),
    Registration.find({ user: req.user._id, status: { $in: ['registered', 'attended'] } })
      .populate('event', 'title slug startDate endDate venue poster')
      .sort({ createdAt: -1 })
      .limit(20),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
    User.countDocuments({ status: 'approved' }),
    Resource.countDocuments({ isActive: true }),
  ]);

  const upcoming = registrations
    .filter((registration) => registration.event && new Date(registration.event.startDate) >= now)
    .sort((a, b) => new Date(a.event.startDate) - new Date(b.event.startDate));

  res.json({
    success: true,
    data: {
      announcements,
      registrations,
      upcoming,
      stats: {
        unread,
        memberCount,
        resources,
        myEvents: registrations.length,
      },
    },
  });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const now = new Date();
  const filter = {
    isPublished: true,
    audience: { $in: ['members', 'public'] },
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  const [items, total] = await Promise.all([
    Announcement.find(filter).sort({ isPinned: -1, publishedAt: -1 }).skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const listDirectory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const { search, dept, wing } = req.query;

  const filter = { status: 'approved' };
  if (dept) filter.dept = new RegExp(String(dept).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (wing) filter.wing = wing;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(safe, 'i') },
      { regNo: new RegExp(safe, 'i') },
      { dept: new RegExp(safe, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('name regNo dept year role photo bio wing email')
      .populate('wing', 'name slug')
      .sort({ role: 1, name: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const listResources = asyncHandler(async (_req, res) => {
  const resources = await Resource.find({ isActive: true }).populate('wing', 'name slug').sort({ order: 1 });
  res.json({ success: true, data: resources });
});

export const listMyRegistrations = asyncHandler(async (req, res) => {
  const items = await Registration.find({ user: req.user._id })
    .populate('event', 'title slug startDate endDate venue poster category')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: items });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const [items, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, unread } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw ApiError.notFound('Notification not found');

  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});
