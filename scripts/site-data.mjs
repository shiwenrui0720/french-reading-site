import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');

export async function loadSiteData() {
  const config = JSON.parse(
    await readFile(path.join(ROOT, 'data', 'site.json'), 'utf8'),
  );
  const articles = await Promise.all(config.articleOrder.map(async (id) => {
    const article = JSON.parse(
      await readFile(path.join(ROOT, 'data', 'articles', `${id}.json`), 'utf8'),
    );
    if (article.id !== id) {
      throw new Error(`Article id mismatch: expected ${id}, received ${article.id}`);
    }
    return article;
  }));

  return {
    articles,
    topics: config.topics,
    articleOrder: config.articleOrder,
  };
}
