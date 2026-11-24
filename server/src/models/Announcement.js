import mongoose from 'mongoose';
import { baseOptions, localizedSchema } from './common.js';

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    title: { type: localizedSchema, required: true },
    body: { type: localizedSchema, required: true },
    audience: { type: String, enum: ['public', 'members'], default: 'members', index: true },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseOptions,
);

announcementSchema.index({ isPinned: -1, publishedAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
