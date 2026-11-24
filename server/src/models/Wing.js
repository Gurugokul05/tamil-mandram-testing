import mongoose from 'mongoose';
import { baseOptions, localizedSchema } from './common.js';

const { Schema } = mongoose;

const wingSchema = new Schema(
  {
    name: { type: localizedSchema, required: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    tagline: { type: localizedSchema, default: () => ({}) },
    description: { type: localizedSchema, default: () => ({}) },
    expectations: { type: [localizedSchema], default: [] },
    gains: { type: [localizedSchema], default: [] },
    icon: { type: String, trim: true, default: 'sparkles' },
    accent: { type: String, trim: true, default: 'maroon' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions,
);

wingSchema.index({ order: 1, name: 1 });

export const Wing = mongoose.model('Wing', wingSchema);
