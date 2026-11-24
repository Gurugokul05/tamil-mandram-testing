import {
  Achievement,
  Announcement,
  Event,
  Faq,
  Registration,
  Resource,
  SiteSetting,
  TeamMember,
  Wing,
} from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';
import { recordAudit } from '../utils/audit.js';

const configs = {
  wings: {
    model: Wing,
    label: 'Wing',
    targetType: 'Wing',
    fields: ['name', 'slug', 'tagline', 'description', 'expectations', 'gains', 'icon', 'accent', 'order', 'isActive'],
    slugFrom: (body) => body.name?.en || body.name?.ta,
    sort: { order: 1 },
  },
  events: {
    model: Event,
    label: 'Event',
    targetType: 'Event',
    fields: [
      'title',
      'slug',
      'summary',
      'description',
      'poster',
      'category',
      'startDate',
      'endDate',
      'venue',
      'eligibility',
      'rules',
      'schedule',
      'memberOnlyInfo',
      'registrationOpen',
      'registrationDeadline',
      'capacity',
      'isFlagship',
      'isPublished',
    ],
    slugFrom: (body) => body.title?.en || body.title?.ta,
    sort: { startDate: -1 },
  },
  achievements: {
    model: Achievement,
    label: 'Achievement',
    targetType: 'Achievement',
    fields: ['title', 'year', 'photo', 'description', 'category', 'order', 'isPublished'],
    sort: { year: -1, order: 1 },
  },
  team: {
    model: TeamMember,
    label: 'Team member',
    targetType: 'TeamMember',
    fields: ['name', 'role', 'group', 'photo', 'email', 'phone', 'socials', 'bio', 'order', 'isActive'],
    sort: { group: 1, order: 1 },
  },
  faqs: {
    model: Faq,
    label: 'FAQ',
    targetType: 'Faq',
    fields: ['question', 'answer', 'order', 'isActive'],
    sort: { order: 1 },
  },
  announcements: {
    model: Announcement,
    label: 'Announcement',
    targetType: 'Announcement',
    fields: ['title', 'body', 'audience', 'isPinned', 'isPublished', 'publishedAt', 'expiresAt'],
    sort: { publishedAt: -1 },
  },
  resources: {
    model: Resource,
    label: 'Resource',
    targetType: 'Resource',
    fields: ['title', 'description', 'type', 'url', 'wing', 'isMemberOnly', 'isActive', 'order'],
    sort: { order: 1 },
  },
};

const getConfig = (entity) => {
  const config = configs[entity];
  if (!config) throw ApiError.notFound('Unknown content type');
  return config;
};

const pickFields = (body, fields) =>
  Object.fromEntries(
    fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]),
  );

export const listContent = asyncHandler(async (req, res) => {
  const config = getConfig(req.params.entity);
  const items = await config.model.find().sort(config.sort);
  res.json({ success: true, data: items });
});

export const getContentItem = asyncHandler(async (req, res) => {
  const config = getConfig(req.params.entity);
  const item = await config.model.findById(req.params.id);
  if (!item) throw ApiError.notFound(`${config.label} not found`);
  res.json({ success: true, data: item });
});

export const createContent = asyncHandler(async (req, res) => {
  const config = getConfig(req.params.entity);
  const data = pickFields(req.body, config.fields);

  if (data.isActive === undefined) data.isActive = true;
  if (data.isPublished === undefined) data.isPublished = true;

  if (config.slugFrom) {
    data.slug = data.slug
      ? await uniqueSlug(config.model, data.slug, req.params.entity)
      : await uniqueSlug(config.model, config.slugFrom(data), req.params.entity);
  }

  if (req.params.entity === 'events') data.createdBy = req.user._id;
  if (['announcements', 'resources'].includes(req.params.entity)) data.createdBy = req.user._id;

  const created = await config.model.create(data);

  await recordAudit({
    actor: req.user,
    action: 'content.created',
    targetType: config.targetType,
    targetId: created._id,
    targetLabel: data.title?.en || data.name?.en || data.question?.en || created.name || '',
    ip: req.ip,
  });

  res.status(201).json({ success: true, message: `${config.label} created`, data: created });
});

export const updateContent = asyncHandler(async (req, res) => {
  const config = getConfig(req.params.entity);
  const item = await config.model.findById(req.params.id);
  if (!item) throw ApiError.notFound(`${config.label} not found`);

  const data = pickFields(req.body, config.fields);

  if (config.slugFrom && data.slug) {
    const candidate = await uniqueSlug(config.model, data.slug, req.params.entity);
    data.slug = candidate === item.slug ? item.slug : candidate;
  }

  Object.assign(item, data);
  await item.save();

  await recordAudit({
    actor: req.user,
    action: 'content.updated',
    targetType: config.targetType,
    targetId: item._id,
    targetLabel: data.title?.en || data.name?.en || item.name || '',
    ip: req.ip,
  });

  res.json({ success: true, message: `${config.label} updated`, data: item });
});

export const deleteContent = asyncHandler(async (req, res) => {
  const config = getConfig(req.params.entity);
  const item = await config.model.findById(req.params.id);
  if (!item) throw ApiError.notFound(`${config.label} not found`);

  if (req.params.entity === 'events') {
    await Registration.deleteMany({ event: item._id });
  }

  await item.deleteOne();

  await recordAudit({
    actor: req.user,
    action: 'content.deleted',
    targetType: config.targetType,
    targetId: item._id,
    targetLabel: item.title?.en || item.name?.en || item.name || '',
    ip: req.ip,
  });

  res.json({ success: true, message: `${config.label} deleted` });
});

const settingsFields = [
  'clubName',
  'tagline',
  'intro',
  'about',
  'establishedYear',
  'heroImage',
  'address',
  'phone',
  'email',
  'whatsappLink',
  'socials',
  'coordinators',
];

const ensureSettings = async () => {
  let settings = await SiteSetting.findOne({ key: 'main' });
  if (!settings) settings = await SiteSetting.create({ key: 'main' });
  return settings;
};

export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await ensureSettings() });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSettings();
  const data = pickFields(req.body, settingsFields);

  if (data.socials) {
    data.socials = { ...(settings.socials.toObject?.() ?? settings.socials), ...data.socials };
  }

  Object.assign(settings, data);

  if (req.body.status) {
    settings.status = {
      ...(settings.status?.toObject ? settings.status.toObject() : settings.status),
      ...req.body.status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    };
  }

  await settings.save();

  await recordAudit({
    actor: req.user,
    action: 'settings.updated',
    targetType: 'SiteSetting',
    targetId: settings._id,
    targetLabel: 'Site settings',
    ip: req.ip,
  });

  res.json({ success: true, message: 'Settings updated', data: settings });
});

export const toggleMembership = asyncHandler(async (req, res) => {
  const settings = await ensureSettings();
  const next = req.body.membershipOpen;

  settings.status.membershipOpen = typeof next === 'boolean' ? next : !settings.status.membershipOpen;
  settings.status.updatedAt = new Date();
  settings.status.updatedBy = req.user._id;
  await settings.save();

  await recordAudit({
    actor: req.user,
    action: 'settings.updated',
    targetType: 'SiteSetting',
    targetId: settings._id,
    targetLabel: `Membership ${settings.status.membershipOpen ? 'opened' : 'closed'}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: `Membership is now ${settings.status.membershipOpen ? 'open' : 'closed'}`,
    data: settings.status,
  });
});
