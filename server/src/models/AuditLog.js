import mongoose from 'mongoose';
import { baseOptions } from './common.js';

const { Schema } = mongoose;

export const AUDIT_ACTIONS = [
  'application.submitted',
  'member.approved',
  'member.rejected',
  'member.suspended',
  'member.reinstated',
  'member.removed',
  'member.role_changed',
  'member.profile_updated',
  'content.created',
  'content.updated',
  'content.deleted',
  'event.attendance_marked',
  'registration.cancelled',
  'settings.updated',
];

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    targetType: { type: String, enum: ['User', 'Event', 'Achievement', 'TeamMember', 'Wing', 'Faq', 'Announcement', 'Resource', 'SiteSetting'], required: true },
    targetId: { type: Schema.Types.ObjectId, default: null },
    targetLabel: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true, default: '' },
  },
  baseOptions,
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
