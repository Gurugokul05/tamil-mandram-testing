import mongoose from 'mongoose';
import { baseOptions, localizedSchema } from './common.js';

const { Schema } = mongoose;

export const NOTIFICATION_TYPES = [
  'application.submitted',
  'application.president_approved',
  'application.president_rejected',
  'application.faculty_approved',
  'application.faculty_rejected',
  'member.suspended',
  'member.removed',
  'event.registration',
  'event.reminder',
  'announcement',
];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: localizedSchema, required: true },
    message: { type: localizedSchema, default: () => ({}) },
    link: { type: String, trim: true, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  baseOptions,
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
