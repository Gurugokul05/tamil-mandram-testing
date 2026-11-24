import mongoose from 'mongoose';
import { baseOptions, localizedSchema } from './common.js';

const { Schema } = mongoose;

const faqSchema = new Schema(
  {
    question: { type: localizedSchema, required: true },
    answer: { type: localizedSchema, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions,
);

faqSchema.index({ order: 1 });

export const Faq = mongoose.model('Faq', faqSchema);
