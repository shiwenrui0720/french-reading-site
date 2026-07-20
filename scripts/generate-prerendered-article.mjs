import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadSiteData, ROOT } from './site-data.mjs';

const BASE = '/french-reading-site';
const BASE_URL = 'https://shiwenrui0720.github.io/french-reading-site';
const articleId = process.argv[2];

if (!articleId) {
  throw new Error('Usage: node scripts/generate-prerendered-article.mjs <article-id>');
}

const source = await readFile(path.join(ROOT, 'src', 'index.template.html'), 'utf8');
const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);

if (!styleMatch) {
  throw new Error('Unable to read styles from src/index.template.html');
}

const data = await loadSiteData();
const article = data.articles.find((item) => item.id === articleId);
const topic = data.topics.find((item) => item.id === article?.topic);

if (!article || !topic) {
  throw new Error(`Unknown article id: ${articleId}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emphasize = (sentence) => {
  const terms = [...(article.highlights || [])].sort((a, b) => b.length - a.length);
  if (!terms.length) return escapeHtml(sentence);
  const expression = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'g');
  return sentence
    .split(expression)
    .map((part) => terms.includes(part)
      ? `<strong class="term">${escapeHtml(part)}</strong>`
      : escapeHtml(part))
    .join('');
};
const richChinese = (translation) => escapeHtml(translation)
  .replace(/\*\*(.+?)\*\*/g, '<strong class="term">$1</strong>');

const articleIndex = data.articleOrder.indexOf(article.id);
const previousArticle = articleIndex > 0
  ? data.articles.find((item) => item.id === data.articleOrder[articleIndex - 1])
  : null;
const nextArticle = articleIndex < data.articleOrder.length - 1
  ? data.articles.find((item) => item.id === data.articleOrder[articleIndex + 1])
  : null;
const navigationLink = (target, label, className = '') => target
  ? `<a class="article-nav-link ${className}" href="${BASE}/article/${target.id}/"><small>${label}</small><strong lang="fr">${escapeHtml(target.title)}</strong></a>`
  : '<span></span>';
const articleNavigation = `<nav class="article-navigation" aria-label="文章导航">${navigationLink(previousArticle, '← 上一篇')}<a class="article-topic-link" href="${BASE}/?topic=${encodeURIComponent(article.topic)}">返回“${escapeHtml(topic.zh)}”目录</a>${navigationLink(nextArticle, '下一篇 →', 'next')}</nav>`;

const canonicalUrl = `${BASE_URL}/article/${article.id}/`;
const imagePath = path.join(ROOT, 'images', `${article.id}-hero.webp`);
const imageUrl = `${BASE_URL}/images/${article.id}-hero.webp`;
const title = `${article.title}（${article.chineseTitle}）｜法语 ${article.level} 分级阅读与听力`;
const description = `${article.title}（${article.chineseTitle}）：${article.level} 法语分级阅读，提供自然女声全文朗读、逐句点读、中文翻译和法国文化拓展。`;

let hasImage = true;
try {
  await access(imagePath);
} catch {
  hasImage = false;
}

let sentenceIndex = 0;
const readingBlocks = article.groups.map((group) => {
  const sentences = group.map((sentence) => {
    const index = sentenceIndex++;
    return `<button type="button" class="sentence" data-sentence="${index}" aria-pressed="false"><span class="sentence-no">${String(index + 1).padStart(2, '0')}</span><span class="sentence-fr" lang="fr">${emphasize(sentence)}</span><span class="sentence-zh" data-translation hidden>${richChinese(article.sentenceTranslations[index])}</span></button>`;
  }).join('');
  return `<section class="reader-block">${sentences}</section>`;
}).join('');

const cultureBlocks = article.culture.map((item) => `<article class="culture-item"><h3 lang="fr">${escapeHtml(item.title)}</h3><p class="culture-fr" lang="fr">${escapeHtml(item.fr)}</p><p class="culture-zh">${escapeHtml(item.zh)}</p></article>`).join('');

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

const clientArticle = JSON.stringify({
  id: article.id,
  groups: article.groups,
  audioPack: article.audioPack,
}).replaceAll('<', '\\u003c');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#76273a">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <meta name="render-mode" content="prerendered-single-article">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  ${hasImage ? `<meta property="og:image" content="${imageUrl}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>
  <style>${styleMatch[1]}</style>
</head>
<body>
  <main class="shell">
    <header class="topbar"><a class="brand" href="${BASE}/"><span class="brand-mark">F</span><span class="brand-word">France en textes</span></a><span class="top-note">文章阅读</span></header>
    <article>
      <header class="article-head article-head-visual"${hasImage ? ` style="--hero-image:url(${BASE}/images/${article.id}-hero.webp)"` : ''}>
        <a class="back" href="${BASE}/?topic=${encodeURIComponent(article.topic)}">← 返回“${escapeHtml(topic.zh)}”目录</a>
        <div class="article-meta"><span class="level">${article.level}</span><span>${escapeHtml(topic.fr)} · ${escapeHtml(topic.zh)}</span></div>
        <h1 lang="fr">${escapeHtml(article.title)}</h1>
        <p class="article-cn-title">${escapeHtml(article.chineseTitle)} · 法语点读</p>
        <p class="article-summary">${escapeHtml(article.summary)} 单击播放或暂停；双击句子显示对应中文；粗体标出重点表达及其中文对应。</p>
      </header>
      <section class="player">
        <button type="button" class="primary" data-play-all><span class="play-disc">▶</span>朗读全篇</button>
        <div class="speed"><span>语速</span><div class="speed-group"><button type="button" data-speed="0.85">0.85× 慢速</button><button type="button" data-speed="1" class="active">1× 自然</button></div></div>
        <div class="status"><span class="dot"></span><span data-status>准备就绪</span></div>
      </section>
      <section>${readingBlocks}</section>
      <section class="culture">
        <p class="culture-kicker">Culture en contexte</p>
        <h2>从 « ${escapeHtml(article.title)} » 读懂法国文化</h2>
        <p class="culture-intro">每段法语约 100–200 词；先读原文，再按句序对照中文，理解词语背后的生活方式。</p>
        ${cultureBlocks}
      </section>
      ${articleNavigation}
    </article>
    <footer>Cliquer · Écouter · Répéter</footer>
  </main>
  <script>
    const BASE=${JSON.stringify(BASE)},ARTICLE=${clientArticle},audio=new Audio();
    const sentences=[...document.querySelectorAll('[data-sentence]')],statusText=document.querySelector('[data-status]'),statusDot=document.querySelector('.dot');
    let current=-1,playing=false,continuous=false,speed=1,segmentEnd=0,audioUrlPromise=null,loadToken=0,clickTimer=0;
    function update(){sentences.forEach((item,index)=>{item.classList.toggle('current',index===current);item.setAttribute('aria-pressed',String(index===current&&playing))});statusDot.classList.toggle('playing',playing);statusText.textContent=current<0?'准备就绪':(playing?'正在朗读':'已暂停')+' · 第 '+(current+1)+' / '+sentences.length+' 句'}
    function finish(){current=-1;playing=false;continuous=false;update()}
    function packedAudioUrl(){if(audioUrlPromise)return audioUrlPromise;audioUrlPromise=Promise.all(ARTICLE.audioPack.chunks.map(item=>fetch(BASE+'/'+item).then(response=>{if(!response.ok)throw new Error('audio '+response.status);return response.arrayBuffer()}))).then(parts=>URL.createObjectURL(new Blob(parts,{type:'audio/mpeg'}))).catch(error=>{audioUrlPromise=null;throw error});return audioUrlPromise}
    function ensureSource(source){if(audio.src===source&&audio.readyState>=1)return Promise.resolve();return new Promise((resolve,reject)=>{const done=()=>{clean();resolve()},fail=()=>{clean();reject(new Error('audio metadata'))},clean=()=>{audio.removeEventListener('loadedmetadata',done);audio.removeEventListener('error',fail)};audio.addEventListener('loadedmetadata',done);audio.addEventListener('error',fail);audio.src=source;audio.load()})}
    async function play(index,all){const token=++loadToken;audio.pause();current=index;continuous=!!all;playing=true;update();try{const source=await packedAudioUrl();if(token!==loadToken)return;await ensureSource(source);if(token!==loadToken)return;const segment=ARTICLE.audioPack.segments[index];audio.currentTime=segment.start;segmentEnd=segment.end;audio.playbackRate=speed;await audio.play()}catch(error){if(token===loadToken){playing=false;continuous=false;statusText.textContent='音频加载失败';statusDot.classList.remove('playing')}}}
    function toggleSentence(index){if(current===index&&audio.src){if(audio.paused){audio.playbackRate=speed;audio.play().then(()=>{playing=true;update()}).catch(()=>{playing=false;update()})}else{audio.pause();playing=false;continuous=false;update()}return}play(index,false)}
    audio.addEventListener('timeupdate',()=>{if(!playing)return;const segments=ARTICLE.audioPack.segments;if(continuous){const index=segments.findIndex((segment,position)=>audio.currentTime<segment.end-.02||position===segments.length-1);if(index>=0&&index!==current){current=index;segmentEnd=segments[index].end;update()}}else if(audio.currentTime>=segmentEnd-.03){audio.pause();finish()}});
    audio.addEventListener('ended',finish);
    document.addEventListener('click',event=>{const sentence=event.target.closest('[data-sentence]');if(sentence){clearTimeout(clickTimer);clickTimer=setTimeout(()=>{clickTimer=0;toggleSentence(Number(sentence.dataset.sentence))},300);return}if(event.target.closest('[data-play-all]')){play(0,true);return}const speedButton=event.target.closest('[data-speed]');if(speedButton){speed=Number(speedButton.dataset.speed);audio.playbackRate=speed;document.querySelectorAll('[data-speed]').forEach(button=>button.classList.toggle('active',button===speedButton))}});
    document.addEventListener('dblclick',event=>{const sentence=event.target.closest('[data-sentence]');if(!sentence)return;event.preventDefault();clearTimeout(clickTimer);clickTimer=0;const translation=sentence.querySelector('[data-translation]');translation.hidden=!translation.hidden});
    update();
  </script>
</body>
</html>
`;

const outputDirectory = path.join(ROOT, 'article', article.id);
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'index.html'), html, 'utf8');

console.log(`Generated prerendered article: article/${article.id}/index.html`);
