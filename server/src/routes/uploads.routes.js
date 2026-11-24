import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { storeImage, uploadImage } from '../middleware/upload.js';
import { asyncHandler } from '../utils/ApiError.js';

const router = Router();

router.post(
  '/image',
  authenticate,
  uploadImage.single('image'),
  asyncHandler(async (req, res) => {
    const image = await storeImage(req.file, req.body.folder || 'tamil-mandram');
    res.status(201).json({ success: true, data: image });
  }),
);

export default router;
