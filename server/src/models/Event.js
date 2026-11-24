import mongoose from 'mongoose';
import { baseOptions, imageSchema, localizedSchema } from './common.js';

const { Schema } = mongoose;

export const EVENT_CATEGORIES = ['flagship', 'competition', 'workshop', 'cultural', 'meetup'];

const scheduleItemSchema = new Schema(
  {
    time: { type: String, trim: true, default: '' },
    title: { type: localizedSchema, default: () => ({}) },
    description: { type: localizedSchema, default: () => ({}) },
  },
  { _id: false },
);

const eventSchema = new Schema(
  {
    title: { type: localizedSchema, required: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    summary: { type: localizedSchema, default: () => ({}) },
    description: { type: localizedSchema, default: () => ({}) },
    poster: { type: imageSchema, default: () => ({}) },
    category: { type: String, enum: EVENT_CATEGORIES, default: 'cultural', index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: Date,
    venue: { type: localizedSchema, default: () => ({}) },
    eligibility: { type: localizedSchema, default: () => ({}) },
    rules: { type: [localizedSchema], default: [] },
    schedule: { type: [scheduleItemSchema], default: [] },
    memberOnlyInfo: { type: localizedSchema, default: () => ({}) },
    registrationOpen: { type: Boolean, default: true },
    registrationDeadline: Date,
    capacity: { type: Number, min: 0, default: 0 },
    isFlagship: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseOptions,
);

eventSchema.index({ startDate: -1, isPublished: 1 });
eventSchema.index({ title: 'text', 'title.en': 'text', 'title.ta': 'text' });

eventSchema.virtual('isPast').get(function isPast() {
  return this.startDate < new Date();
});

export const Event = mongoose.model('Event', eventSchema);
