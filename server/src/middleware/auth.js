import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

const loadUser = async (token) => {
  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);

  if (!user) throw ApiError.unauthorized('This account no longer exists');
  if (Number(payload.v || 0) !== Number(user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Your session has been revoked. Please sign in again.');
  }
  if (user.status === 'removed') {
    throw ApiError.forbidden('This account has been removed from the Mandram');
  }

  return user;
};

export const authenticate = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized());

  try {
    req.user = await loadUser(token);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = await loadUser(token);
  } catch {
    req.user = undefined;
  }
  return next();
};

export const requireApproved = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.status !== 'approved') {
    return next(ApiError.forbidden('Your membership must be approved before you can use this area'));
  }
  return next();
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

export const isAdmin = (user) => ['president', 'faculty_coordinator'].includes(user?.role);
