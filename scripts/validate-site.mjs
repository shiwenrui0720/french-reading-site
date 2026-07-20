import { access, readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadSiteData, ROOT } from './site-data.mjs';

const VALID_LEVELS = new Set(['A2', 'B1', 'B2']);
const ARTICLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function occurrences(text, search) {
  return search ? text.split(search).length - 1 : 0;
}

function chineseBoldCount(text) {
  return [...text.matchAll(/\*\*(.+?)\*\*/g)].length;
}

async function assertNonEmptyFile(relativePath) {
  const file = path.join(ROOT, relativePath);
  await access(file);
  const details = await stat(file);
  invariant(details.isFile() && details.size > 0, `Empty file: ${relativePath}`);
}

export async function validateSiteData(data) {
  data ??= await loadSiteData();
  invariant(data.articles.length === data.articleOrder.length, 'Article order length mismatch');
  invariant(new Set(data.articleOrder).size === data.articleOrder.length, 'Duplicate id in articleOrder');
  invariant(new Set(data.articles.map((article) => article.id)).size === data.articles.length, 'Duplicate article id');

  const topicIds = new Set(data.topics.map((topic) => topic.id));
  const articleFiles = (await readdir(path.join(ROOT, 'data', 'articles')))
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -5))
    .sort();
  invariant(
    JSON.stringify(articleFiles) === JSON.stringify([...data.articleOrder].sort()),
    'data/articles files do not exactly match articleOrder',
  );

  let sentenceTotal = 0;
  let cultureTotal = 0;

  for (const article of data.articles) {
    const prefix = `[${article.id}]`;
    invariant(ARTICLE_ID_PATTERN.test(article.id), `${prefix} invalid id`);
    invariant(typeof article.title === 'string' && article.title.trim(), `${prefix} missing French title`);
    invariant(typeof article.chineseTitle === 'string' && article.chineseTitle.trim(), `${prefix} missing Chinese title`);
    invariant(VALID_LEVELS.has(article.level), `${prefix} invalid level: ${article.level}`);
    invariant(topicIds.has(article.topic), `${prefix} unknown topic: ${article.topic}`);
    invariant(typeof article.summary === 'string' && article.summary.trim(), `${prefix} missing summary`);
    invariant(Array.isArray(article.groups) && article.groups.length > 0, `${prefix} missing paragraph groups`);

    const sentences = article.groups.flat();
    invariant(sentences.every((sentence) => typeof sentence === 'string' && sentence.trim()), `${prefix} empty French sentence`);
    invariant(Array.isArray(article.sentenceTranslations), `${prefix} missing sentenceTranslations`);
    invariant(sentences.length === article.sentenceTranslations.length, `${prefix} French/Chinese sentence count mismatch`);
    invariant(article.sentenceTranslations.every((item) => typeof item === 'string' && item.trim()), `${prefix} empty Chinese translation`);
    sentenceTotal += sentences.length;

    const highlights = article.highlights || [];
    invariant(new Set(highlights).size === highlights.length, `${prefix} duplicate highlighted expression`);
    for (const highlight of highlights) {
      invariant(sentences.some((sentence) => sentence.includes(highlight)), `${prefix} unused highlight: ${highlight}`);
    }
    sentences.forEach((sentence, index) => {
      const frenchCount = highlights.reduce((total, highlight) => total + occurrences(sentence, highlight), 0);
      const chineseCount = chineseBoldCount(article.sentenceTranslations[index]);
      invariant(
        frenchCount === chineseCount,
        `${prefix} bold mismatch in sentence ${index + 1}: French ${frenchCount}, Chinese ${chineseCount}`,
      );
    });

    invariant(Array.isArray(article.culture) && article.culture.length === 3, `${prefix} culture section must contain exactly 3 paragraphs`);
    article.culture.forEach((item, index) => {
      invariant(typeof item.title === 'string' && item.title.trim(), `${prefix} culture ${index + 1} missing title`);
      invariant(typeof item.fr === 'string' && item.fr.trim(), `${prefix} culture ${index + 1} missing French`);
      invariant(typeof item.zh === 'string' && item.zh.trim(), `${prefix} culture ${index + 1} missing Chinese`);
      invariant(Array.isArray(item.zhSentences) && item.zhSentences.length > 0, `${prefix} culture ${index + 1} missing Chinese sentence array`);
      invariant(item.zhSentences.join('') === item.zh, `${prefix} culture ${index + 1} Chinese paragraph differs from sentence array`);
      cultureTotal += 1;
    });

    if (article.hasAudio) {
      invariant(article.audioPack && Array.isArray(article.audioPack.chunks), `${prefix} missing audio pack`);
      invariant(article.audioPack.segments.length === sentences.length, `${prefix} audio segment count mismatch`);
      for (const chunk of article.audioPack.chunks) await assertNonEmptyFile(chunk);
      let previousEnd = -1;
      article.audioPack.segments.forEach((segment, index) => {
        invariant(Number.isFinite(segment.start) && Number.isFinite(segment.end), `${prefix} audio segment ${index + 1} is not numeric`);
        invariant(segment.start >= 0 && segment.end > segment.start, `${prefix} invalid audio segment ${index + 1}`);
        invariant(segment.start >= previousEnd - 0.01, `${prefix} overlapping audio segment ${index + 1}`);
        previousEnd = segment.end;
      });
    }

    if (article.topic === 'food') {
      await assertNonEmptyFile(`images/${article.id}-hero.webp`);
    }
  }

  return {
    articles: data.articles.length,
    sentences: sentenceTotal,
    cultureParagraphs: cultureTotal,
  };
}

export async function validateGeneratedSite(data) {
  data ??= await loadSiteData();
  const index = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  const fallback = await readFile(path.join(ROOT, '404.html'), 'utf8');
  invariant(index === fallback, 'index.html and 404.html differ');
  invariant(!index.includes('__SITE_DATA__'), 'Generated homepage still contains data placeholder');

  const articleDirectories = (await readdir(path.join(ROOT, 'article'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  invariant(
    JSON.stringify(articleDirectories) === JSON.stringify([...data.articleOrder].sort()),
    'Generated article directories do not exactly match articleOrder',
  );

  for (const article of data.articles) {
    const page = await readFile(path.join(ROOT, 'article', article.id, 'index.html'), 'utf8');
    invariant(page.includes('<meta name="render-mode" content="prerendered-single-article">'), `[${article.id}] missing prerender marker`);
    invariant(page.includes(`<h1 lang="fr">${article.title}</h1>`), `[${article.id}] missing title in generated HTML`);
    invariant(page.includes(`const BASE="/french-reading-site",ARTICLE={"id":"${article.id}"`), `[${article.id}] missing isolated client data`);
  }

  const sitemap = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  invariant(urlCount === data.articles.length + 1, `Sitemap URL count mismatch: ${urlCount}`);
  for (const id of data.articleOrder) {
    invariant(sitemap.includes(`/article/${id}/`), `Sitemap missing article: ${id}`);
  }

  return {
    pages: data.articles.length,
    sitemapUrls: urlCount,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = await loadSiteData();
  const content = await validateSiteData(data);
  const generated = await validateGeneratedSite(data);
  console.log(JSON.stringify({ content, generated }, null, 2));
}
