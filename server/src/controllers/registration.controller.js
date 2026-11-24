import QRCode from 'qrcode';
import { z } from 'zod';
import { Event, Registration, User } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notifyUser } from '../utils/notify.js';
import { recordAudit } from '../utils/audit.js';
import { formatDate } from '../utils/dates.js';

export const registerSchema = z.object({
  teamName: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
});

const findEvent = async (slug) => {
  const byId = /^[a-f\d]{24}$/i.test(slug);
  const event = await Event.findOne({ ...(byId ? { _id: slug } : { slug }), isPublished: true });
  if (!event) throw ApiError.notFound('Event not found');
  return event;
};

export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await findEvent(req.params.slug);
  const now = new Date();

  if (event.registrationOpen === false) throw ApiError.badRequest('Registration is closed for this event');
  if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
    throw ApiError.badRequest('The registration deadline has passed');
  }
  if (new Date(event.startDate) < now) throw ApiError.badRequest('This event has already started');

  const existing = await Registration.findOne({ event: event._id, user: req.user._id });

  if (existing && existing.status !== 'cancelled') {
    throw ApiError.conflict('You are already registered for this event');
  }

  if (event.capacity > 0) {
    const count = await Registration.countDocuments({
      event: event._id,
      status: { $in: ['registered', 'attended'] },
    });
    if (count >= event.capacity) throw ApiError.badRequest('All seats are taken for this event');
  }

  let registration = existing;
  if (registration) {
    registration.status = 'registered';
    registration.teamName = req.body.teamName || '';
    registration.notes = req.body.notes || '';
    await registration.save();
  } else {
    registration = await Registration.create({
      event: event._id,
      user: req.user._id,
      teamName: req.body.teamName || '',
      notes: req.body.notes || '',
    });
  }

  await notifyUser({
    user: req.user,
    type: 'event.registration',
    title: { ta: 'நிகழ்வுப் பதிவு உறுதி செய்யப்பட்டது', en: 'Your event registration is confirmed' },
    message: {
      ta: `${event.title.ta || event.title.en} — ${formatDate(event.startDate, 'ta')}. உங்கள் QR பாஸ் தயாராக உள்ளது.`,
      en: `${event.title.en || event.title.ta} on ${formatDate(event.startDate, 'en')}. Your QR pass is ready.`,
    },
    link: `/dashboard/events`,
    email: {
      subject: 'Event registration confirmed',
      body: `You are registered for ${event.title.en || event.title.ta}. Your pass code is ${registration.passCode}.`,
    },
  });

  res.status(201).json({
    success: true,
    message: 'You are registered. Your QR pass is ready.',
    data: registration,
  });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findOne({ _id: req.params.id, user: req.user._id });
  if (!registration) throw ApiError.notFound('Registration not found');
  if (registration.status === 'attended') throw ApiError.badRequest('Attendance has already been marked');
  if (registration.status === 'cancelled') throw ApiError.badRequest('This registration is already cancelled');

  registration.status = 'cancelled';
  await registration.save();

  await recordAudit({
    actor: req.user,
    action: 'registration.cancelled',
    targetType: 'Event',
    targetId: registration.event,
    targetLabel: 'Event registration cancelled',
    reason: req.body.reason || '',
    ip: req.ip,
  });

  res.json({ success: true, message: 'Registration cancelled', data: registration });
});

export const getPass = asyncHandler(async (req, res) => {
  const registration = await Registration.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'event',
    'title slug startDate venue',
  );
  if (!registration) throw ApiError.notFound('Registration not found');
  if (!['registered', 'attended'].includes(registration.status)) {
    throw ApiError.badRequest('This registration is not active');
  }

  const payload = JSON.stringify({ code: registration.passCode, event: registration.event?.slug });
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 640,
    margin: 2,
    color: { dark: '#4A0E1C', light: '#FBF7EF' },
  });

  res.json({
    success: true,
    data: {
      passCode: registration.passCode,
      status: registration.status,
      checkedInAt: registration.checkedInAt,
      event: registration.event,
      qr: dataUrl,
    },
  });
});

export const scanPass = asyncHandler(async (req, res) => {
  const code = String(req.body.passCode || '').trim().toUpperCase();
  if (!code) throw ApiError.badRequest('Pass code is required');

  const registration = await Registration.findOne({ passCode: code })
    .populate('user', 'name email regNo dept year photo')
    .populate('event', 'title slug startDate');

  if (!registration) throw ApiError.notFound('That pass could not be found');
  if (registration.status === 'cancelled') throw ApiError.badRequest('This registration was cancelled');

  if (registration.status === 'attended') {
    return res.json({
      success: true,
      message: 'Already checked in',
      data: {
        registration,
        alreadyCheckedIn: true,
        checkedInAt: registration.checkedInAt,
      },
    });
  }

  registration.status = 'attended';
  registration.checkedInAt = new Date();
  registration.checkedInBy = req.user._id;
  await registration.save();

  await recordAudit({
    actor: req.user,
    action: 'event.attendance_marked',
    targetType: 'Event',
    targetId: registration.event?._id,
    targetLabel: registration.user?.name || registration.passCode,
    meta: { passCode: registration.passCode },
    ip: req.ip,
  });

  res.json({ success: true, message: 'Attendance marked', data: { registration, alreadyCheckedIn: false } });
});

export const listEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');

  const registrations = await Registration.find({ event: event._id })
    .populate('user', 'name email regNo dept year phone photo')
    .sort({ createdAt: 1 });

  if (req.query.format === 'csv') {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Register No', 'Department', 'Year', 'Phone', 'Status', 'Pass code', 'Team', 'Checked in'],
      ...registrations.map((registration) => [
        registration.user?.name,
        registration.user?.email,
        registration.user?.regNo,
        registration.user?.dept,
        registration.user?.year,
        registration.user?.phone,
        registration.status,
        registration.passCode,
        registration.teamName,
        registration.checkedInAt ? new Date(registration.checkedInAt).toISOString() : '',
      ]),
    ];

    const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.slug}-registrations.csv"`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: registrations,
    meta: {
      event: { id: String(event._id), title: event.title, slug: event.slug },
      total: registrations.length,
      attended: registrations.filter((item) => item.status === 'attended').length,
    },
  });
});
