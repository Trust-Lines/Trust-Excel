// Public address of the app, used for links in emails (invites, notifications).
// FRONTEND_URL is not used here: it is the CORS origin list and may still hold an old address.
export function appUrl(): string {
  const explicit = (process.env.APP_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;
  return 'https://trust-excel.vercel.app';
}
