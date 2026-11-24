import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, v: user.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'tamil-mandram',
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { issuer: 'tamil-mandram' });
