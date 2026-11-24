import { z } from 'zod';
import { User } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { recordAudit } from '../utils/audit.js';
import { notifyUser } from '../utils/notify.js';
import { emailSchema } from '../middleware/validate.js';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(72);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim().max(20).optional().default(''),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

const publicUser = (user) => {
  const data = user.toJSON();
  if (user.wing && user.wing.name) {
    data.wing = {
      id: String(user.wing._id),
      name: user.wing.name,
      slug: user.wing.slug,
    };
  }
  return data;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = new User({
    name,
    email,
    phone,
    status: 'profile_incomplete',
    role: 'member',
  });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Account created. Complete your profile to apply.',
    data: { token: signToken(user), user: publicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash').populate('wing', 'name slug');

  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  if (user.status === 'removed') {
    throw ApiError.forbidden('This account has been removed from the Mandram');
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({
    success: true,
    data: { token: signToken(user), user: publicUser(user) },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wing', 'name slug');
  res.json({ success: true, data: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.json({ success: true, message: 'Signed out of all sessions' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await user.verifyPassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  await user.setPassword(req.body.newPassword);
  user.tokenVersion += 1;
  await user.save();

  res.json({ success: true, message: 'Password updated. Please sign in again.' });
});

export const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(500).optional().default(''),
});

const stageConfig = {
  president: {
    from: 'pending_president',
    next: 'pending_faculty',
    decisionField: 'presidentDecision',
    roles: ['president'],
    action: { approve: 'member.approved', reject: 'member.rejected' },
  },
  faculty: {
    from: 'pending_faculty',
    next: 'approved',
    decisionField: 'facultyDecision',
    roles: ['faculty_coordinator'],
    action: { approve: 'member.approved', reject: 'member.rejected' },
  },
};

export const decideApplication = (stage) => asyncHandler(async (req, res) => {
  const config = stageConfig[stage];
  if (!config) throw ApiError.badRequest('Unknown review stage');

  if (!config.roles.includes(req.user.role)) {
    throw ApiError.forbidden('You cannot review applications at this stage');
  }

  const { decision, reason } = req.body;
  const application = await User.findById(req.params.id);

  if (!application) throw ApiError.notFound('Application not found');
  if (application.status !== config.from) {
    throw ApiError.badRequest('This application is not waiting at your stage');
  }
  if (decision === 'reject' && reason.trim().length < 5) {
    throw ApiError.badRequest('Please give a reason (at least 5 characters) when rejecting');
  }

  application[config.decisionField] = {
    by: req.user._id,
    at: new Date(),
    approved: decision === 'approve',
  };

  if (decision === 'approve') {
    application.status = config.next;
    if (config.next === 'approved') application.approvedAt = new Date();
  } else {
    application.status = 'rejected';
    application.rejectionReason = reason;
  }

  await application.save();

  await recordAudit({
    actor: req.user,
    action: config.action[decision],
    targetType: 'User',
    targetId: application._id,
    targetLabel: application.name,
    reason,
    meta: { stage },
    ip: req.ip,
  });

  const approved = decision === 'approve';
  await notifyUser({
    user: application,
    type: approved
      ? stage === 'president'
        ? 'application.president_approved'
        : 'application.faculty_approved'
      : stage === 'president'
        ? 'application.president_rejected'
        : 'application.faculty_rejected',
    title: approved
      ? stage === 'president'
        ? { ta: 'உங்கள் விண்ணப்பம் தலைவரால் அனுமதிக்கப்பட்டது', en: 'Your application passed the president review' }
        : { ta: 'உங்கள் சேர்க்கை அனுமதிக்கப்பட்டது', en: 'Your membership is approved' }
      : { ta: 'உங்கள் விண்ணப்பம் அனுமதிக்கப்படவில்லை', en: 'Your application was not approved' },
    message: approved
      ? stage === 'president'
        ? { ta: 'இப்போது ஆசிரியர் ஒருங்கிணைப்பாளரின் இறுதி அனுமதிக்காகக் காத்திருக்கிறது.', en: 'It is now waiting for the faculty coordinator’s final approval.' }
        : { ta: 'தமிழ் மன்றக் குடும்பத்திற்கு வரவேற்கிறோம்! இப்போது உறுப்பினர் பகுதி திறக்கப்பட்டுள்ளது.', en: 'Welcome to the Tamil Mandram family. Your member area is now open.' }
      : { ta: reason, en: reason },
    link: approved && stage === 'faculty' ? '/dashboard' : '/status',
    email: {
      subject: approved ? 'Membership update' : 'Application update',
      body: approved
        ? `Hello ${application.name},\n\nYour Tamil Mandram application has been approved at the ${stage} stage.`
        : `Hello ${application.name},\n\nYour Tamil Mandram application was not approved. Reason: ${reason}`,
    },
  });

  if (decision === 'approve' && stage === 'president') {
    const faculty = await User.find({ role: 'faculty_coordinator', status: 'approved' }).select('name email');
    await Promise.all(
      faculty.map((person) =>
        notifyUser({
          user: person,
          type: 'application.submitted',
          title: { ta: 'புதிய விண்ணப்பம் காத்திருக்கிறது', en: 'An application is waiting for you' },
          message: { ta: `${application.name} ஆசிரியர் அனுமதிக்காகக் காத்திருக்கிறார்.`, en: `${application.name} is waiting for faculty approval.` },
          link: '/admin/approvals',
          email: { subject: 'Application awaiting faculty approval', body: `${application.name} passed the president review.` },
        }),
      ),
    );
  }

  res.json({
    success: true,
    message: approved ? 'Application approved' : 'Application rejected',
    data: publicUser(application),
  });
});
