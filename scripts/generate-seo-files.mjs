// Runs after `npm run build` (npm "postbuild" hook).
// Writes sitemap.xml and robots.txt into the build output, based on the routes Angular actually
// prerendered — so new products appear in the sitemap automatically.
// The domain comes from `siteUrl` in src/environments/environment.ts (or SITE_URL env var).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist', 'ceroleather');
const browser = join(dist, 'browser');
const routesFile = join(dist, 'prerendered-routes.json');

if (!existsSync(routesFile)) {
  console.error('[seo] prerendered-routes.json not found — run `ng build` first.');
  process.exit(1);
}

const env = readFileSync(join(root, 'src', 'environments', 'environment.ts'), 'utf8');
const siteUrl = (process.env.SITE_URL || env.match(/siteUrl:\s*'([^']+)'/)?.[1] || '').replace(
  /\/$/,
  '',
);
if (!siteUrl) {
  console.error('[seo] siteUrl missing in environment.ts');
  process.exit(1);
}

const routes = Object.keys(JSON.parse(readFileSync(routesFile, 'utf8')).routes);
const today = new Date().toISOString().slice(0, 10);
const priority = (r) =>
  r === '/' ? '1.0' : r === '/katalog' ? '0.9' : r.startsWith('/katalog/') ? '0.8' : '0.6';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${siteUrl}${r === '/' ? '/' : r}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority(r)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(join(browser, 'sitemap.xml'), xml);
writeFileSync(join(browser, 'robots.txt'), robots);
console.log(`[seo] sitemap.xml (${routes.length} URLs) and robots.txt written for ${siteUrl}`);
