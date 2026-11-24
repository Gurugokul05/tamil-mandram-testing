import { z } from 'zod';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    const error = new Error('Validation failed');
    error.name = 'ZodError';
    error.statusCode = 422;
    error.details = errors;
    return next(error);
  }

  req[source] = result.data;
  return next();
};

export const localizedString = (max = 2000) =>
  z.object({
    ta: z.string().trim().max(max).optional().default(''),
    en: z.string().trim().max(max).optional().default(''),
  });

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);
