/**
 * Verifies that the EmailJS template, the Angular parameter list, the test parameters and the
 * field-mapping document all use exactly the same variable names.
 *
 *   npm run check:emailjs                 → check only
 *   npm run check:emailjs -- <outDir>     → also render preview HTML (with / without photo / custom idea)
 *
 * No dependencies; the renderer implements the subset of EmailJS syntax the template uses:
 * {{name}} (HTML-escaped) and {{#name}}…{{/name}} (rendered only when the value is non-empty).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
let failed = false;
const fail = (msg) => {
  failed = true;
  console.error('✘ ' + msg);
};
const ok = (msg) => console.log('✔ ' + msg);
const diff = (a, b) => [...a].filter((x) => !b.has(x));

// 1. Angular: ORDER_EMAIL_PARAMS
const ts = read('src/app/core/services/order-email-params.ts');
const block = ts.match(/ORDER_EMAIL_PARAMS = \[([\s\S]*?)\] as const/);
if (!block) throw new Error('ORDER_EMAIL_PARAMS not found');
const angular = new Set([...block[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]));

// 2. Template variables
const html = read('docs/emailjs-template.html').replace(/<!--[\s\S]*?-->/g, '');
const tplVars = new Set([...html.matchAll(/\{\{\s*[#/^]?\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]));
const opened = [...html.matchAll(/\{\{#([A-Za-z0-9_]+)\}\}/g)].map((m) => m[1]);
const closed = [...html.matchAll(/\{\{\/([A-Za-z0-9_]+)\}\}/g)].map((m) => m[1]);

// 3. Test params, 4. mapping doc (2nd table: param names in the 2nd column)
const test = JSON.parse(read('docs/emailjs-test-params.json'));
const testKeys = new Set(Object.keys(test));
const mapping = read('docs/emailjs-field-mapping.md');
const mapSection = mapping.split('## 2.')[1]?.split('## 3.')[0] ?? '';
const mapKeys = new Set(
  mapSection
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.startsWith('|---'))
    .map((l) => l.split('|')[2]?.trim().match(/^`([A-Za-z0-9_]+)`$/)?.[1])
    .filter(Boolean),
);

const unknownInTemplate = diff(tplVars, angular);
unknownInTemplate.length
  ? fail(`template uses variables Angular never sends: ${unknownInTemplate.join(', ')}`)
  : ok(`all ${tplVars.size} template variables are sent by Angular`);
const unusedInTemplate = diff(angular, tplVars);
console.log(`  (sent but not shown in the HTML template, text-only: ${unusedInTemplate.join(', ') || 'none'})`);
const allowedUnused = new Set(['address_full', 'measurements_summary', 'order_summary', 'subject', 'reply_to']);
const unexpectedUnused = unusedInTemplate.filter((k) => !allowedUnused.has(k));
unexpectedUnused.length
  ? fail(`parameters missing from the template: ${unexpectedUnused.join(', ')}`)
  : ok('every displayed parameter appears in the template (subject/reply_to are template settings)');

JSON.stringify(opened.sort()) === JSON.stringify(closed.sort())
  ? ok(`conditional blocks balanced: ${opened.join(', ')}`)
  : fail(`unbalanced {{#…}}/{{/…}}: opened ${opened} closed ${closed}`);

const t1 = diff(angular, testKeys), t2 = diff(testKeys, angular);
t1.length || t2.length
  ? fail(`test params mismatch — missing: ${t1.join(', ') || '-'}; unknown: ${t2.join(', ') || '-'}`)
  : ok(`docs/emailjs-test-params.json has a value for all ${angular.size} parameters`);
const empty = Object.entries(test).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
empty.length ? fail(`test params without example value: ${empty.join(', ')}`) : ok('every test parameter has an example value');

const m1 = diff(angular, mapKeys), m2 = diff(mapKeys, angular);
m1.length || m2.length
  ? fail(`mapping doc mismatch — missing: ${m1.join(', ') || '-'}; unknown: ${m2.join(', ') || '-'}`)
  : ok(`docs/emailjs-field-mapping.md documents all ${angular.size} parameters`);

if (/\{\{\{/.test(html)) fail('template uses unescaped {{{…}}} — customer text must stay escaped');
if (/attachment|base64/i.test(html)) fail('template mentions attachments/base64');

// Optional preview rendering
const outDir = process.argv[2];
if (outDir) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const render = (tpl, p) =>
    tpl
      .replace(/\{\{#([A-Za-z0-9_]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, inner) => (p[k] ? inner : ''))
      .replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, k) => esc(p[k] ?? `[[MISSING ${k}]]`));
  const variants = {
    'with-photo': test,
    'without-photo': { ...test, designImageUrl: '' },
    'custom-idea-minimal': {
      ...test,
      subject: 'Novi zahtev za custom dizajn — Marko Petrović',
      request_type: 'Sopstvena ideja (custom dizajn)',
      product_name: 'Sopstvena ideja (custom)',
      product_slug: 'sopstvena-ideja',
      product_category: 'Custom modeli',
      product_url: '',
      height_cm: 'Nije uneto (opciono)',
      customization: 'Nema dodatnih zahteva',
      message: 'Kupac nije ostavio poruku',
      designImageUrl: '',
    },
  };
  mkdirSync(outDir, { recursive: true });
  for (const [name, params] of Object.entries(variants)) {
    const page = `<!doctype html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(params.subject)}</title></head><body style="margin:0">${render(html, params)}</body></html>`;
    if (page.includes('[[MISSING')) fail(`preview ${name} has missing values`);
    writeFileSync(join(outDir, `email-${name}.html`), page);
  }
  ok(`previews written to ${outDir}`);
}

process.exit(failed ? 1 : 0);
