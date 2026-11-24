import mongoose from 'mongoose';
import { baseOptions, localizedSchema } from './common.js';

const { Schema } = mongoose;

const resourceSchema = new Schema(
  {
    title: { type: localizedSchema, required: true },
    description: { type: localizedSchema, default: () => ({}) },
    type: { type: String, enum: ['pdf', 'link', 'doc', 'video'], default: 'link' },
    url: { type: String, required: true, trim: true },
    wing: { type: Schema.Types.ObjectId, ref: 'Wing', default: null },
    isMemberOnly: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseOptions,
);

resourceSchema.index({ order: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
