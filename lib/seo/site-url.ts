export function siteUrl(path = "") {
  const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const origin = configured ? (configured.startsWith("http") ? configured : `https://${configured}`) : "http://localhost:3000";
  return new URL(path, `${origin.replace(/\/$/, "")}/`).toString();
}
