import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { baseOptions, imageSchema } from './common.js';

const { Schema } = mongoose;

export const ROLES = ['member', 'student_coordinator', 'president', 'faculty_coordinator'];

export const STATUSES = [
  'profile_incomplete',
  'pending_president',
  'pending_faculty',
  'approved',
  'rejected',
  'suspended',
  'removed',
];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    regNo: { type: String, trim: true, uppercase: true, index: { unique: true, sparse: true } },
    dept: { type: String, trim: true, default: '' },
    year: { type: Number, min: 1, max: 6 },
    wing: { type: Schema.Types.ObjectId, ref: 'Wing', default: null },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    photo: { type: imageSchema, default: () => ({}) },
    role: { type: String, enum: ROLES, default: 'member', index: true },
    status: { type: String, enum: STATUSES, default: 'pending_president', index: true },
    profileCompleted: { type: Boolean, default: false },
    rejectionReason: { type: String, trim: true, default: '' },
    suspensionReason: { type: String, trim: true, default: '' },
    presidentDecision: {
      by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      at: Date,
      approved: Boolean,
    },
    facultyDecision: {
      by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      at: Date,
      approved: Boolean,
    },
    approvedAt: Date,
    lastLoginAt: Date,
    tokenVersion: { type: Number, default: 0 },
  },
  baseOptions,
);

userSchema.index({ name: 'text', regNo: 'text', email: 'text' });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.virtual('isApproved').get(function isApproved() {
  return this.status === 'approved';
});

userSchema.virtual('isAdmin').get(function isAdmin() {
  return ['president', 'faculty_coordinator'].includes(this.role);
});

export const User = mongoose.model('User', userSchema);
