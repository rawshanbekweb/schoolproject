import slugifyLib from 'slugify';

export const slugify = (text: string): string => {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'uz',
    trim: true,
  });
};

export const uniqueSlug = (text: string): string => {
  const base = slugify(text);
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
};
