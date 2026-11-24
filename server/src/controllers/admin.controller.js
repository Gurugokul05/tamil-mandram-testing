import { AuditLog, Event, Registration, User, Wing } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { recordAudit } from '../utils/audit.js';
import { notifyUser } from '../utils/notify.js';

const pageParams = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const serialize = (user) => {
  const data = user.toJSON();
  return data;
};

export const listApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const status = req.query.status || 'pending';

  const filter = status === 'pending'
    ? { status: { $in: ['pending_president', 'pending_faculty'] } }
    : { status };

  const [items, total] = await Promise.all([
    User.find(filter).populate('wing', 'name slug').sort({ createdAt: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const { search, status, role, wing } = req.query;

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (role && role !== 'all') filter.role = role;
  if (wing) filter.wing = wing;
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(safe, 'i') },
      { email: new RegExp(safe, 'i') },
      { regNo: new RegExp(safe, 'i') },
      { dept: new RegExp(safe, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('wing', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getMember = asyncHandler(async (req, res) => {
  const member = await User.findById(req.params.id).populate('wing', 'name slug');
  if (!member) throw ApiError.notFound('Member not found');
  res.json({ success: true, data: member });
});

const assertManageable = (actor, target) => {
  if (String(actor._id) === String(target._id)) {
    throw ApiError.badRequest('You cannot change your own membership');
  }
  if (['president', 'faculty_coordinator'].includes(target.role) && actor.role !== 'faculty_coordinator') {
    throw ApiError.forbidden('Only the faculty coordinator can manage office bearers');
  }
};

const reasonSchema = (reason) => {
  const value = String(reason || '').trim();
  if (value.length < 5) throw ApiError.badRequest('Please give a reason (at least 5 characters)');
  return value;
};

export const suspendMember = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Member not found');
  assertManageable(req.user, target);

  if (target.status === 'removed') throw ApiError.badRequest('This member has already been removed');

  const reason = reasonSchema(req.body.reason);

  target.status = 'suspended';
  target.suspensionReason = reason;
  target.tokenVersion += 1;
  await target.save();

  await recordAudit({
    actor: req.user,
    action: 'member.suspended',
    targetType: 'User',
    targetId: target._id,
    targetLabel: target.name,
    reason,
    ip: req.ip,
  });

  await notifyUser({
    user: target,
    type: 'member.suspended',
    title: { ta: 'உங்கள் உறுப்பினர் அனுமதி நிறுத்தப்பட்டுள்ளது', en: 'Your membership has been suspended' },
    message: { ta: reason, en: reason },
    link: '/status',
    email: { subject: 'Membership suspended', body: `Your membership was suspended. Reason: ${reason}` },
  });

  res.json({ success: true, message: 'Member suspended', data: serialize(target) });
});

export const reinstateMember = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Member not found');
  assertManageable(req.user, target);

  if (!['suspended', 'rejected'].includes(target.status)) {
    throw ApiError.badRequest('Only suspended or rejected members can be reinstated');
  }

  target.status = 'approved';
  target.suspensionReason = '';
  target.rejectionReason = '';
  target.approvedAt = target.approvedAt || new Date();
  target.tokenVersion += 1;
  await target.save();

  await recordAudit({
    actor: req.user,
    action: 'member.reinstated',
    targetType: 'User',
    targetId: target._id,
    targetLabel: target.name,
    reason: req.body.reason || '',
    ip: req.ip,
  });

  await notifyUser({
    user: target,
    type: 'application.faculty_approved',
    title: { ta: 'உங்கள் உறுப்பினர் அனுமதி மீட்டமைக்கப்பட்டது', en: 'Your membership has been reinstated' },
    message: { ta: 'இப்போது மீண்டும் உறுப்பினர் பகுதியைப் பயன்படுத்தலாம்.', en: 'You can use the member area again.' },
    link: '/dashboard',
    email: { subject: 'Membership reinstated', body: 'Your Tamil Mandram membership has been reinstated.' },
  });

  res.json({ success: true, message: 'Member reinstated', data: serialize(target) });
});

export const removeMember = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Member not found');
  assertManageable(req.user, target);

  const reason = reasonSchema(req.body.reason);

  target.status = 'removed';
  target.suspensionReason = reason;
  target.tokenVersion += 1;
  await target.save();

  await recordAudit({
    actor: req.user,
    action: 'member.removed',
    targetType: 'User',
    targetId: target._id,
    targetLabel: target.name,
    reason,
    ip: req.ip,
  });

  await notifyUser({
    user: target,
    type: 'member.removed',
    title: { ta: 'உங்கள் உறுப்பினர் பதிவு நீக்கப்பட்டுள்ளது', en: 'Your membership has been removed' },
    message: { ta: reason, en: reason },
    link: '/contact',
    email: { subject: 'Membership removed', body: `Your Tamil Mandram membership has been removed. Reason: ${reason}` },
  });

  res.json({ success: true, message: 'Member removed', data: serialize(target) });
});

export const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const roles = ['member', 'student_coordinator', 'president', 'faculty_coordinator'];

  if (!roles.includes(role)) throw ApiError.badRequest('Unknown role');
  if (role === 'faculty_coordinator' && req.user.role !== 'faculty_coordinator') {
    throw ApiError.forbidden('Only faculty can appoint a faculty coordinator');
  }

  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Member not found');
  assertManageable(req.user, target);

  const previous = target.role;
  target.role = role;
  await target.save();

  await recordAudit({
    actor: req.user,
    action: 'member.role_changed',
    targetType: 'User',
    targetId: target._id,
    targetLabel: target.name,
    meta: { from: previous, to: role },
    ip: req.ip,
  });

  res.json({ success: true, message: 'Role updated', data: serialize(target) });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find()
      .populate('actor', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(),
  ]);

  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getStats = asyncHandler(async (_req, res) => {
  const [pending, approved, suspended, events, registrations, wings] = await Promise.all([
    User.countDocuments({ status: { $in: ['pending_president', 'pending_faculty'] } }),
    User.countDocuments({ status: 'approved' }),
    User.countDocuments({ status: 'suspended' }),
    Event.countDocuments(),
    Registration.countDocuments({ status: { $in: ['registered', 'attended'] } }),
    Wing.countDocuments({ isActive: true }),
  ]);

  res.json({
    success: true,
    data: { pending, approved, suspended, events, registrations, wings },
  });
});
