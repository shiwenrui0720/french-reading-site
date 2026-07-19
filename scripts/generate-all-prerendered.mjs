import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const source = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const dataMatch = source.match(/const BASE="\/french-reading-site",DATA=(\{.*?\});const app=/s);

if (!dataMatch) {
  throw new Error('Unable to find article data in index.html');
}

const data = JSON.parse(dataMatch[1]);
const generator = path.join(ROOT, 'scripts', 'generate-prerendered-article.mjs');

for (const article of data.articles) {
  await run(process.execPath, [generator, article.id], { cwd: ROOT });
  console.log(`Generated ${article.id}`);
}

console.log(`Generated ${data.articles.length} prerendered article pages.`);
