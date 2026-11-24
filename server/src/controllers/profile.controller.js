import { z } from 'zod';
import { SiteSetting, User, Wing } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notifyUser } from '../utils/notify.js';
import { recordAudit } from '../utils/audit.js';

const phonePattern = /^[+\d\s-]{0,20}$/;

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  regNo: z
    .string()
    .trim()
    .min(3, 'Enter your register number')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Register number can contain letters, numbers and hyphens'),
  dept: z.string().trim().min(2, 'Enter your department').max(80),
  year: z.coerce.number().int().min(1, 'Year must be between 1 and 6').max(6),
  wing: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Choose a wing')
    .optional()
    .nullable(),
  phone: z.string().trim().max(20).regex(phonePattern, 'Enter a valid phone number'),
  bio: z.string().trim().max(500).optional().default(''),
  photo: z
    .object({
      url: z.string().trim().max(500).optional().default(''),
      publicId: z.string().trim().max(200).optional().default(''),
      alt: z.string().trim().max(160).optional().default(''),
    })
    .optional(),
});

const withWing = async (user) => {
  const populated = await User.findById(user._id).populate('wing', 'name slug');
  const data = populated.toJSON();
  if (populated.wing && populated.wing.name) {
    data.wing = { id: String(populated.wing._id), name: populated.wing.name, slug: populated.wing.slug };
  }
  return data;
};

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await withWing(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) throw ApiError.notFound('Account not found');
  if (['suspended', 'removed'].includes(user.status)) {
    throw ApiError.forbidden('This account cannot update its profile');
  }

  if (req.body.wing) {
    const wing = await Wing.findById(req.body.wing);
    if (!wing) throw ApiError.badRequest('That wing does not exist');
  }

  const wasIncomplete = ['profile_incomplete', 'rejected'].includes(user.status);

  if (wasIncomplete) {
    const settings = await SiteSetting.findOne({ key: 'main' }).select('status');
    if (settings && settings.status?.membershipOpen === false) {
      throw ApiError.forbidden('Membership applications are currently closed. Please check the site banner for the next intake.');
    }
  }

  user.name = req.body.name;
  user.regNo = req.body.regNo;
  user.dept = req.body.dept;
  user.year = req.body.year;
  user.wing = req.body.wing || null;
  user.phone = req.body.phone;
  user.bio = req.body.bio || '';
  if (req.body.photo) user.photo = req.body.photo;
  user.profileCompleted = true;

  if (wasIncomplete) {
    user.status = 'pending_president';
    user.rejectionReason = '';
    user.presidentDecision = { by: null, at: null, approved: undefined };
    user.facultyDecision = { by: null, at: null, approved: undefined };
  }

  await user.save();

  await recordAudit({
    actor: user,
    action: wasIncomplete ? 'application.submitted' : 'member.profile_updated',
    targetType: 'User',
    targetId: user._id,
    targetLabel: user.name,
    reason: wasIncomplete ? 'Profile submitted for review' : '',
    ip: req.ip,
  });

  if (wasIncomplete) {
    const presidents = await User.find({ role: 'president', status: 'approved' }).select('name email');
    await Promise.all(
      presidents.map((person) =>
        notifyUser({
          user: person,
          type: 'application.submitted',
          title: { ta: 'புதிய உறுப்பினர் விண்ணப்பம்', en: 'New membership application' },
          message: {
            ta: `${user.name} (${user.dept}) விண்ணப்பத்தைச் சமர்ப்பித்துள்ளார்.`,
            en: `${user.name} from ${user.dept} submitted a membership application.`,
          },
          link: '/admin/approvals',
          email: { subject: 'New membership application', body: `${user.name} submitted an application.` },
        }),
      ),
    );
  }

  res.json({
    success: true,
    message: wasIncomplete
      ? 'Profile submitted. The president will review your application.'
      : 'Profile updated',
    data: await withWing(user),
  });
});
