import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { loadSiteData, ROOT } from './site-data.mjs';
import { validateGeneratedSite, validateSiteData } from './validate-site.mjs';

const run = promisify(execFile);
const BASE_URL = 'https://shiwenrui0720.github.io/french-reading-site';
const data = await loadSiteData();
const contentSummary = await validateSiteData(data);
const template = await readFile(path.join(ROOT, 'src', 'index.template.html'), 'utf8');

if ((template.match(/__SITE_DATA__/g) || []).length !== 1) {
  throw new Error('src/index.template.html must contain exactly one __SITE_DATA__ placeholder');
}

const clientData = JSON.stringify({ articles: data.articles, topics: data.topics })
  .replaceAll('<', '\\u003c');
const homepage = template.replace('__SITE_DATA__', clientData);
await writeFile(path.join(ROOT, 'index.html'), homepage, 'utf8');
await writeFile(path.join(ROOT, '404.html'), homepage, 'utf8');

const generator = path.join(ROOT, 'scripts', 'generate-prerendered-article.mjs');
for (const id of data.articleOrder) {
  await run(process.execPath, [generator, id], { cwd: ROOT });
}

const today = new Date().toISOString().slice(0, 10);
const urls = [`${BASE_URL}/`, ...data.articleOrder.map((id) => `${BASE_URL}/article/${id}/`)];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');
await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(
  path.join(ROOT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`,
  'utf8',
);

const generatedSummary = await validateGeneratedSite(data);
console.log(JSON.stringify({ content: contentSummary, generated: generatedSummary }, null, 2));
