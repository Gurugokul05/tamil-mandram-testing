import mongoose from 'mongoose';
import { baseOptions, imageSchema, localizedSchema } from './common.js';

const { Schema } = mongoose;

export const TEAM_GROUPS = ['faculty', 'office_bearers', 'student_coordinators', 'wing_leads'];

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: localizedSchema, required: true },
    group: { type: String, enum: TEAM_GROUPS, default: 'student_coordinators', index: true },
    photo: { type: imageSchema, default: () => ({}) },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    socials: {
      linkedin: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
    },
    bio: { type: localizedSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  baseOptions,
);

teamMemberSchema.index({ group: 1, order: 1 });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
