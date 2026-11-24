import mongoose from 'mongoose';
import { baseOptions, imageSchema, localizedSchema } from './common.js';

const { Schema } = mongoose;

const coordinatorSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    role: { type: localizedSchema, default: () => ({}) },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
  },
  { _id: false },
);

const siteSettingSchema = new Schema(
  {
    key: { type: String, unique: true, default: 'main', immutable: true },
    clubName: {
      type: localizedSchema,
      default: () => ({ ta: 'தமிழ் மன்றம்', en: 'Tamil Mandram' }),
    },
    tagline: {
      type: localizedSchema,
      default: () => ({ ta: 'மொழியால் இணைவோம்', en: 'United by language, rooted in culture' }),
    },
    intro: { type: localizedSchema, default: () => ({}) },
    about: { type: localizedSchema, default: () => ({}) },
    establishedYear: { type: Number, default: 2019 },
    heroImage: { type: imageSchema, default: () => ({}) },
    address: { type: localizedSchema, default: () => ({}) },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    whatsappLink: { type: String, trim: true, default: '' },
    socials: {
      instagram: { type: String, trim: true, default: '' },
      youtube: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      x: { type: String, trim: true, default: '' },
    },
    coordinators: { type: [coordinatorSchema], default: [] },
    status: {
      membershipOpen: { type: Boolean, default: true },
      intakeYear: { type: Number, default: new Date().getFullYear() },
      currentIntake: { type: localizedSchema, default: () => ({}) },
      nextIntake: { type: localizedSchema, default: () => ({}) },
      nextIntakeDate: Date,
      note: { type: localizedSchema, default: () => ({}) },
      updatedAt: Date,
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  baseOptions,
);

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
