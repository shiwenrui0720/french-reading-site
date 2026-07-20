# France en textes

法语短文点读与法国文化双语阅读网站。项目以分级阅读、自然女声朗读、逐句点读和文化拓展为核心，当前作为非商业个人学习项目公开。

## 在线访问

- 网站：<https://shiwenrui0720.github.io/french-reading-site/>
- 仓库：<https://github.com/shiwenrui0720/french-reading-site>

## 当前内容

截至 2026 年 7 月，网站已上线 39 / 80 篇：

| 分类 | 已上线 | 书中总数 |
| --- | ---: | ---: |
| 食物、美味 | 14 | 14 |
| 名人 | 12 | 12 |
| 历史、制度 | 13 | 13 |
| 工业、教育、工作 | 0 | 12 |
| 语言、媒体、文化 | 0 | 15 |
| 日常生活 | 0 | 14 |

级别分布：A2 5 篇、B1 29 篇、B2 5 篇。

## 网站功能

- 首页可按 A2、B1、B2 级别或书中主题浏览文章。
- 每篇文章支持自然女声全文朗读和逐句点读。
- 单击句子播放或暂停；双击句子显示对应中文翻译。
- 正文中的日常表达和固定搭配以粗体标出，中文翻译保留对应粗体。
- 每篇文章附三段法语文化拓展及按句序对应的中文翻译。
- 食物、美味类文章配有不影响正文阅读的页面图片。
- 单篇文章提供上一篇、下一篇和返回当前主题目录的导航。

## 文件结构

```text
french-reading-site/
├── index.html                 # 自动生成的网站主入口
├── 404.html                   # 自动生成的备用入口，与 index.html 同步
├── .nojekyll                  # 告诉 GitHub Pages 直接发布静态文件
├── data/
│   ├── site.json              # 主题设置和文章顺序
│   └── articles/
│       └── <article-id>.json  # 每篇文章唯一的内容源文件
├── src/
│   └── index.template.html    # 首页样式和交互模板
├── audio-packs/
│   └── <article-id>/01.bin    # 每篇文章的朗读音频包
├── article/
│   └── <article-id>/index.html # 自动生成的单篇内容预渲染页
├── images/
│   └── <article-id>-hero.webp # 文章页图片，目前用于美食类
├── scripts/
│   ├── build-site.mjs         # 校验并一键生成整个网站
│   ├── generate-prerendered-article.mjs # 仅生成指定单篇静态页
│   ├── site-data.mjs          # 统一读取网站数据
│   └── validate-site.mjs      # 内容和生成结果自动检查
├── docs/
│   ├── content-guide.md       # 内容、翻译、音频与图片规范
│   └── sources.md             # 正文、音频、图片及许可记录
├── robots.txt                 # 搜索引擎抓取规则
├── sitemap.xml                # 已生成静态页面的网址清单
├── CHANGELOG.md               # 重要版本变更
└── README.md                  # 项目说明
```

当前仓库同时保存内容源文件和可直接部署的静态成品。文章内容分别存放在 `data/articles/`；构建脚本把它们组合进 `index.html` 和 `404.html`，并生成 `article/<article-id>/index.html`。音频包虽然使用 `.bin` 扩展名，内部是浏览器可播放的 MP3 音频数据。

## 本地查看

由于网站使用 GitHub 项目页路径 `/french-reading-site`，不建议直接双击 `index.html`。可在包含项目文件夹的上一级目录启动静态服务器：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/french-reading-site/
```

若本地文件夹不是 `french-reading-site`，需要保持相同的访问路径，或在生成版本时调整网站的基础路径。

## GitHub Pages 部署

仓库采用 GitHub Pages 项目网站形式：

- 仓库：`shiwenrui0720/french-reading-site`
- 发布分支：`main`
- 发布目录：仓库根目录 `/`
- 网站基础路径：`/french-reading-site`

提交到 `main` 后，GitHub Pages 通常会自动生成新版网站。部署完成后应检查首页、文章直达链接、图片和音频是否正常。

## 更新文章的基本步骤

1. 新增或修改 `data/articles/<article-id>.json`，并在 `data/site.json` 中维护文章顺序，遵守 [`docs/content-guide.md`](docs/content-guide.md)。
2. 核对法语正文、逐句中文、粗体对应和三段文化拓展。
3. 生成并验证文章音频包；确认分句数与音频时间段数一致。
4. 如需图片，加入经过来源和许可核验的 WebP 文件，并更新 [`docs/sources.md`](docs/sources.md)。
5. 运行 `node scripts/build-site.mjs`，由程序校验并重新生成首页、404 页面、所有单篇页、站点地图和抓取规则。
6. 本地检查首页筛选、文章直达、全文朗读、句子点读、双击翻译和移动端阅读。
7. 更新 [`CHANGELOG.md`](CHANGELOG.md)，提交到 GitHub，并复查线上版本。

`index.html`、`404.html` 和 `article/*/index.html` 都是生成后的成品文件，不应分别手工修改。正式修改应在 `data/` 或 `src/index.template.html` 中完成。

每篇已上线文章均生成独立的预渲染静态页。重新生成指定文章可运行：

```bash
node scripts/generate-prerendered-article.mjs aperitif
```

校验并重新生成整个网站可运行：

```bash
node scripts/build-site.mjs
```

只复查现有生成结果可运行：

```bash
node scripts/validate-site.mjs
```

自动检查涵盖文章文件与顺序、法中句数、粗体数量、三段文化拓展、文化中文逐句合并结果、音频文件与分段、食品图片、静态页面隔离、首页与 404 一致性，以及站点地图完整性。预渲染页会把本篇法语正文、逐句中文和文化拓展直接写入 HTML，页面脚本只携带本篇播放所需的数据。

## 文档维护

- 新增或调整文章规范时，更新 `docs/content-guide.md`。
- 新增正文、图片、音频或外部资料时，更新 `docs/sources.md`。
- 每次公开发布重要内容或功能时，更新 `CHANGELOG.md`。
- 仅修改错别字也应在提交信息中说明修改对象。

## 版权说明

本网站为非商业个人学习项目。教材原文主要选自德尼·C. 梅耶尔编著的《阅读法国80篇》，相关版权归原作者及出版机构所有。本站不提供原书下载，不替代原书购买与阅读；如权利人对相关内容有异议，将及时删除或调整。

素材来源与许可的详细记录见 [`docs/sources.md`](docs/sources.md)。非商业与个人学习说明不替代必要的来源核验或授权。
