import mongoose from 'mongoose';
import { baseOptions, imageSchema, localizedSchema } from './common.js';

const { Schema } = mongoose;

export const ACHIEVEMENT_CATEGORIES = ['award', 'recognition', 'publication', 'milestone'];

const achievementSchema = new Schema(
  {
    title: { type: localizedSchema, required: true },
    year: { type: Number, required: true, index: true },
    photo: { type: imageSchema, default: () => ({}) },
    description: { type: localizedSchema, default: () => ({}) },
    category: { type: String, enum: ACHIEVEMENT_CATEGORIES, default: 'award' },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  baseOptions,
);

achievementSchema.index({ year: -1, order: 1 });

export const Achievement = mongoose.model('Achievement', achievementSchema);
