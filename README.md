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

## 文件结构

```text
french-reading-site/
├── index.html                 # 网站主入口、文章数据、样式与交互
├── 404.html                   # 直接访问文章网址时的备用入口，与 index.html 同步
├── .nojekyll                  # 告诉 GitHub Pages 直接发布静态文件
├── audio-packs/
│   └── <article-id>/01.bin    # 每篇文章的朗读音频包
├── article/
│   └── <article-id>/index.html # 39篇单篇内容预渲染页
├── images/
│   └── <article-id>-hero.webp # 文章页图片，目前用于美食类
├── scripts/
│   ├── generate-prerendered-article.mjs # 生成指定单篇静态页
│   └── generate-all-prerendered.mjs # 批量生成全部单篇静态页
├── docs/
│   ├── content-guide.md       # 内容、翻译、音频与图片规范
│   └── sources.md             # 正文、音频、图片及许可记录
├── robots.txt                 # 搜索引擎抓取规则
├── sitemap.xml                # 已生成静态页面的网址清单
├── CHANGELOG.md               # 重要版本变更
└── README.md                  # 项目说明
```

当前仓库保存的是可直接部署的静态成品。`index.html` 内含文章数据和音频分句时间；`404.html` 与其内容相同，以支持 `/article/<article-id>` 形式的直接访问。音频包虽然使用 `.bin` 扩展名，内部是浏览器可播放的 MP3 音频数据。

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

1. 在生成源数据中新增或修改文章，遵守 [`docs/content-guide.md`](docs/content-guide.md)。
2. 核对法语正文、逐句中文、粗体对应和三段文化拓展。
3. 生成并验证文章音频包；确认分句数与音频时间段数一致。
4. 如需图片，加入经过来源和许可核验的 WebP 文件，并更新 [`docs/sources.md`](docs/sources.md)。
5. 重新生成 `index.html`，再将同一成品同步为 `404.html`。
6. 本地检查首页筛选、文章直达、全文朗读、句子点读、双击翻译和移动端阅读。
7. 更新 [`CHANGELOG.md`](CHANGELOG.md)，提交到 GitHub，并复查线上版本。

`index.html` 和 `404.html` 是生成后的成品文件。除紧急修正外，不建议只手工修改其中一个文件；正式修改应从生成源数据完成，并保证两个文件一致。

每篇已上线文章均生成独立的预渲染静态页。重新生成指定文章可运行：

```bash
node scripts/generate-prerendered-article.mjs aperitif
```

批量重新生成全部文章可运行：

```bash
node scripts/generate-all-prerendered.mjs
```

预渲染页会把本篇法语正文、逐句中文和文化拓展直接写入 HTML，页面脚本只携带本篇播放所需的数据；生成过程同时更新 `sitemap.xml` 和 `robots.txt`。

## 文档维护

- 新增或调整文章规范时，更新 `docs/content-guide.md`。
- 新增正文、图片、音频或外部资料时，更新 `docs/sources.md`。
- 每次公开发布重要内容或功能时，更新 `CHANGELOG.md`。
- 仅修改错别字也应在提交信息中说明修改对象。

## 版权说明

本网站为非商业个人学习项目。教材原文主要选自德尼·C. 梅耶尔编著的《阅读法国80篇》，相关版权归原作者及出版机构所有。本站不提供原书下载，不替代原书购买与阅读；如权利人对相关内容有异议，将及时删除或调整。

素材来源与许可的详细记录见 [`docs/sources.md`](docs/sources.md)。非商业与个人学习说明不替代必要的来源核验或授权。
