export const slugify = (value = '') =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const uniqueSlug = async (Model, source, fallback = 'item') => {
  const base = slugify(source) || fallback;
  let candidate = base;
  let counter = 2;

  while (await Model.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
};

export const pickLocalized = (value) => (value ? { ta: value.ta || '', en: value.en || '' } : { ta: '', en: '' });
