import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../uploads');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(ApiError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
    }
    return callback(null, true);
  },
});

const cloudinaryReady = Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

if (cloudinaryReady) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export async function storeImage(file, folder = 'tamil-mandram') {
  if (!file) throw ApiError.badRequest('No image was uploaded');

  if (cloudinaryReady) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', transformation: [{ width: 1600, crop: 'limit' }] },
        (error, result) => {
          if (error) return reject(ApiError.badRequest('Image upload failed. Please try again.'));
          return resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  const extension = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
  const filename = `${crypto.randomBytes(10).toString('hex')}.${extension}`;
  fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);

  return { url: `/uploads/${filename}`, publicId: '' };
}
