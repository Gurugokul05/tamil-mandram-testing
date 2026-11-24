import mongoose from 'mongoose';

const { Schema } = mongoose;

export const localizedSchema = new Schema(
  {
    ta: { type: String, trim: true, default: '' },
    en: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

export const imageSchema = new Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

export const baseOptions = {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform(_doc, ret) {
      if (ret._id) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      delete ret.passwordHash;
      return ret;
    },
  },
};

export const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
