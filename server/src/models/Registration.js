import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { baseOptions } from './common.js';

const { Schema } = mongoose;

export const REGISTRATION_STATUSES = ['registered', 'waitlisted', 'cancelled', 'attended'];

const registrationSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'registered', index: true },
    passCode: {
      type: String,
      unique: true,
      default: () => `TM-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    },
    teamName: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    checkedInAt: Date,
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseOptions,
);

registrationSchema.index({ event: 1, user: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
