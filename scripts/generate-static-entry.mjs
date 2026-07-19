import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE_URL = 'https://shiwenrui0720.github.io/french-reading-site';
const articleId = process.argv[2];

if (!articleId) {
  throw new Error('Usage: node scripts/generate-static-entry.mjs <article-id>');
}

const source = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const dataMatch = source.match(/const BASE="\/french-reading-site",DATA=(\{.*?\});const app=/s);

if (!dataMatch) {
  throw new Error('Unable to find article data in index.html');
}

const data = JSON.parse(dataMatch[1]);
const article = data.articles.find((item) => item.id === articleId);

if (!article) {
  throw new Error(`Unknown article id: ${articleId}`);
}

const canonicalUrl = `${BASE_URL}/article/${article.id}/`;
const imagePath = path.join(ROOT, 'images', `${article.id}-hero.webp`);
const imageUrl = `${BASE_URL}/images/${article.id}-hero.webp`;
const title = `${article.title}（${article.chineseTitle}）｜法语 ${article.level} 分级阅读与听力`;
const description = `${article.title}（${article.chineseTitle}）：${article.level} 法语分级阅读，提供自然女声全文朗读、逐句点读、中文翻译和法国文化拓展。`;

const escapeAttribute = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

let hasImage = true;
try {
  await access(imagePath);
} catch {
  hasImage = false;
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: `${article.title}（${article.chineseTitle}）`,
  description,
  url: canonicalUrl,
  inLanguage: ['fr', 'zh-CN'],
  educationalLevel: article.level,
  learningResourceType: ['Reading', 'Listening'],
  isAccessibleForFree: true,
  ...(hasImage ? { image: imageUrl } : {}),
};

const extraHead = [
  `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}">`,
  '<meta name="robots" content="index,follow">',
  '<meta property="og:type" content="article">',
  `<meta property="og:title" content="${escapeAttribute(title)}">`,
  `<meta property="og:description" content="${escapeAttribute(description)}">`,
  `<meta property="og:url" content="${escapeAttribute(canonicalUrl)}">`,
  ...(hasImage ? [`<meta property="og:image" content="${escapeAttribute(imageUrl)}">`] : []),
  '<meta name="twitter:card" content="summary_large_image">',
  `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`,
].join('');

const output = source
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeAttribute(description)}">`)
  .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)}</title>${extraHead}`);

const outputDirectory = path.join(ROOT, 'article', article.id);
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'index.html'), output, 'utf8');

const articleRoot = path.join(ROOT, 'article');
const staticArticleIds = [];
for (const entry of await readdir(articleRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  try {
    await access(path.join(articleRoot, entry.name, 'index.html'));
    staticArticleIds.push(entry.name);
  } catch {
    // Ignore incomplete article directories.
  }
}

staticArticleIds.sort();
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `${BASE_URL}/`,
  ...staticArticleIds.map((id) => `${BASE_URL}/article/${id}/`),
];
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

console.log(`Generated static entry: article/${article.id}/index.html`);
console.log(`Static articles in sitemap: ${staticArticleIds.length}`);
