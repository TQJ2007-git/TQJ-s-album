# Editorial 视觉风格升级 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前简陋的图片墙升级为有 editorial 气质的摄影作品集 —— 加独立首屏、字体配色精致化、图墙加大留白。

**Architecture:** 这是一个零运行时依赖的静态站点，所有 HTML/CSS/JS 都由 [scripts/build.js](scripts/build.js) 内的字符串模板生成，输出到 `public/`。本次改动 **只修改 [scripts/build.js](scripts/build.js)** 的三处字符串模板（HTML body、CSS、不动 JS），构建命令、图片处理、CNAME、灯箱功能完全保留。

**Tech Stack:** Node.js + sharp（构建）；纯 HTML / CSS / 原生 JS（产物）；系统字体（Georgia + 中文衬线 fallback），无外部字体或框架。

**Reference spec:** [docs/plans/2026-05-20-editorial-style-upgrade-design.md](docs/plans/2026-05-20-editorial-style-upgrade-design.md)

---

## File Structure

整个改动只触及一个文件：

- **Modify:** [scripts/build.js](scripts/build.js)
  - `build()` 函数中的 `html` 字符串模板（第 79-96 行附近）— 在 `<body>` 内加 hero、给 gallery 包 main、加 footer
  - `writeStaticAssets()` 函数中的 `css` 字符串模板（第 123-217 行附近）— 替换 body 颜色、新增 hero/footer 样式、调整 gallery 间距和 hover、媒体查询同步
  - `writeStaticAssets()` 函数中的 `js` 字符串模板（第 222-297 行附近）— **不动**

构建产物 `public/index.html`、`public/style.css`、`public/lightbox.js` 由构建脚本重新生成，不直接编辑。

**No tests:** 这是一个无测试框架、无运行时逻辑的纯静态站点（构建脚本只做文件复制和模板替换）。验证方式是 `npm run build` 成功 + 浏览器目视检查 hero/图墙/页脚样式。每个任务结束都会跑一次 build 并打开 `public/index.html` 看效果。

---

## Task 1: 在 HTML 模板中加入 hero、main 包裹、footer

**Files:**
- Modify: `scripts/build.js`（`build()` 函数中的 `html` 字符串模板，约第 79-96 行）

- [ ] **Step 1: 替换 HTML 模板字符串**

打开 [scripts/build.js](scripts/build.js)，找到 `const html = ...` 这段（约第 79 行起）。把整个模板字符串替换为：

```javascript
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Album · 摄影作品</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-label">PORTFOLIO · 2026</div>
      <h1 class="hero-title">Album</h1>
      <div class="hero-subtitle">摄影作品</div>
      <div class="hero-divider"></div>
      <p class="hero-quote">You will never walk alone</p>
      <div class="hero-author">— tqj</div>
    </div>
    <a href="#gallery" class="hero-scroll">↓ SCROLL</a>
  </section>
  <main id="gallery" class="gallery">
${imgTags}
  </main>
  <footer class="site-footer">
    <div class="footer-divider"></div>
    <div class="footer-text">© 2026 tqj</div>
  </footer>
  <div class="lightbox" id="lightbox">
    <img id="lightbox-img" src="" alt="">
  </div>
  <script src="lightbox.js"></script>
</body>
</html>`;
```

要点：
- `<title>` 从 `摄影作品` 改成 `Album · 摄影作品`
- `.gallery` 从 `<div>` 改成 `<main id="gallery">`，让 hero 的 `↓ SCROLL` 链接可以锚到它
- 新增 `<section class="hero">` 和 `<footer class="site-footer">`
- 灯箱 `<div class="lightbox">` 和 `<script>` 引用保持不动

- [ ] **Step 2: 运行构建**

Run: `npm run build`
Expected: 构建成功，输出 `Generated: index.html` 等日志，无 sharp 报错。

- [ ] **Step 3: 检查产物 HTML 结构**

打开 `public/index.html` 用文本编辑器看一眼，确认：
- 顶部有 `<section class="hero">` 块且包含 `Album` / `摄影作品` / `You will never walk alone` / `— tqj` 文本
- 图墙 tag 是 `<main id="gallery" class="gallery">`
- 底部有 `<footer class="site-footer">` 包含 `© 2026 tqj`
- 灯箱 div 仍在底部

此时浏览器打开会样式错乱（CSS 还没改），不用管视觉，只看结构。

- [ ] **Step 4: 提交**

```bash
git add scripts/build.js
git commit -m "feat(build): add hero section and footer to HTML template"
```

---

## Task 2: 替换 CSS — body 配色、hero 样式、footer 样式

**Files:**
- Modify: `scripts/build.js`（`writeStaticAssets()` 中的 `css` 字符串模板，约第 123-217 行）

- [ ] **Step 1: 替换整段 CSS 模板**

在 [scripts/build.js](scripts/build.js) 找到 `function writeStaticAssets()` 内的 `const css = \`...\`;`（约第 123 行起，到第 217 行的反引号结束）。把整个反引号字符串替换为下面这段。

注意：因为这是 JavaScript 模板字符串，CSS 里的反斜杠保持原样即可，不需要转义；但如果出现反引号需要写成 `` \` ``（本段无）。

```javascript
  const css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: #0f0d0a;
  color: #e8e2d6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== Hero ===== */

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  position: relative;
}

.hero-inner {
  max-width: 720px;
  width: 100%;
  text-align: left;
}

.hero-label {
  color: #5a4d3d;
  font-size: 11px;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 32px;
}

.hero-title {
  font-family: Georgia, "Times New Roman", serif;
  color: #e8e2d6;
  font-size: 64px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.5px;
}

.hero-subtitle {
  font-family: "Songti SC", "Source Han Serif SC", "Noto Serif SC", serif;
  color: #a89888;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 6px;
  margin-top: 8px;
}

.hero-divider {
  width: 28px;
  height: 1px;
  background: #5a4d3d;
  margin-top: 24px;
}

.hero-quote {
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  color: #e8e2d6;
  font-size: 16px;
  margin-top: 24px;
}

.hero-author {
  color: #a89888;
  font-size: 12px;
  letter-spacing: 1px;
  margin-top: 12px;
}

.hero-scroll {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  color: #5a4d3d;
  font-size: 11px;
  letter-spacing: 4px;
  text-decoration: none;
  animation: heroScroll 1.5s ease-in-out infinite;
}

@keyframes heroScroll {
  0%, 100% { transform: translate(-50%, 0); }
  50%      { transform: translate(-50%, 4px); }
}

/* ===== Gallery ===== */

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 32px;
}

.gallery img {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.gallery img:hover {
  opacity: 0.7;
  transform: scale(0.99);
}

/* ===== Footer ===== */

.site-footer {
  margin-top: 80px;
  padding-bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.footer-divider {
  width: 28px;
  height: 1px;
  background: #5a4d3d;
}

.footer-text {
  color: #a89888;
  font-size: 11px;
  letter-spacing: 2px;
}

/* ===== Lightbox (unchanged) ===== */

.lightbox {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}

.lightbox.active {
  display: flex;
}

.lightbox img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
}

.lightbox .nav-prev,
.lightbox .nav-next {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  opacity: 0;
  transition: opacity 0.2s;
  user-select: none;
}

.lightbox .nav-prev:hover,
.lightbox .nav-next:hover {
  opacity: 1;
}

.lightbox .nav-prev { left: 0; }
.lightbox .nav-next { right: 0; }

.lightbox .counter {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: #888;
  font-size: 0.875rem;
}

/* ===== Mobile ===== */

@media (max-width: 600px) {
  .hero {
    padding: 24px;
  }

  .hero-label {
    font-size: 10px;
    letter-spacing: 3px;
    margin-bottom: 24px;
  }

  .hero-title {
    font-size: 40px;
  }

  .hero-subtitle {
    font-size: 14px;
    letter-spacing: 5px;
  }

  .hero-quote {
    font-size: 14px;
  }

  .hero-author {
    font-size: 11px;
  }

  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .site-footer {
    margin-top: 48px;
    padding-bottom: 40px;
  }
}
`;
```

- [ ] **Step 2: 运行构建**

Run: `npm run build`
Expected: 构建成功，输出 `Generated: style.css` 等日志。

- [ ] **Step 3: 浏览器目视检查（桌面尺寸）**

直接在文件管理器双击打开 `public/index.html`（或拖到浏览器），桌面窗口下检查：

- [ ] 首屏一整屏暖黑色背景，居中收窄一栏文字（左对齐）
- [ ] 顶部有 `PORTFOLIO · 2026` 小字标签
- [ ] `Album` 是大号衬线字（约 64px），`摄影作品` 是衬线小字、字距明显拉宽
- [ ] 副标下方有一条短横线
- [ ] 引言 `You will never walk alone` 是斜体衬线
- [ ] 作者 `— tqj` 在引言下方
- [ ] 屏幕底部居中有 `↓ SCROLL` 在缓慢上下浮动
- [ ] 点击 `↓ SCROLL` 平滑滚动到图墙
- [ ] 图墙间距明显比之前宽（24px gap、32px padding）
- [ ] 鼠标 hover 图片：图片轻微变暗 + 微缩，过渡平滑
- [ ] 点击图片仍能正常打开灯箱（功能没坏）
- [ ] 图墙下方有 28px 短横线 + `© 2026 tqj` 居中页脚

如果哪一项不符，**回到 Step 1 修对应规则**，再次 build 检查。不要带着已知问题进入下一个 Step。

- [ ] **Step 4: 浏览器目视检查（手机尺寸）**

打开浏览器 DevTools，切到手机模拟（iPhone SE 或 375×667）。检查：

- [ ] hero 仍然占满整屏不溢出，文字大小自动缩小（标题约 40px）
- [ ] 图墙变成手机版 `minmax(160px, 1fr)`，`gap` 12px、`padding` 16px
- [ ] 页脚 margin-top 缩小到 48px

- [ ] **Step 5: 提交**

```bash
git add scripts/build.js
git commit -m "style: editorial visual upgrade — hero, warm dark palette, larger gallery gaps"
```

---

## Task 3: 端到端验证 + 全量截图自检

**Files:**
- 仅运行命令、检查产物，不改代码

- [ ] **Step 1: 全新构建（确保无残留）**

Run（在项目根目录）:

```bash
rm -rf public && npm run build
```

Expected: 输出 `Found N photos`、每张图的 thumb/full 处理日志、`Generated: index.html`、`Generated: style.css`、`Generated: lightbox.js`、`Total public size: X.XMB`。无错误。

- [ ] **Step 2: 检查产物文件齐全**

Run: `ls public/`
Expected 输出包含: `CNAME`, `index.html`, `lightbox.js`, `photos`, `style.css`

Run: `ls public/photos/thumb | wc -l` 和 `ls public/photos/full | wc -l`
Expected: 两个数字相等且都等于 `photos/` 目录下原图数量。

- [ ] **Step 3: 浏览器全流程走查**

在浏览器打开 `public/index.html`，从上到下走一遍：

- [ ] 首屏视觉与 Task 2 Step 3 一致
- [ ] 滚动到图墙，所有图片都能加载（lazy load 不出现 broken icon）
- [ ] 点开任意图：灯箱出现，纯黑遮罩，图片居中
- [ ] 灯箱内左右方向键切换图片
- [ ] 灯箱内 Esc 关闭
- [ ] 关闭灯箱后页面滚动位置仍在原图墙位置
- [ ] 滚到底部看到 `© 2026 tqj` 页脚

- [ ] **Step 4: 检查 git 状态干净**

Run: `git status`
Expected: `working tree clean`（前两个 task 都已 commit）。

如果有未提交的内容，检查是不是 `public/` 被意外 git tracked（不应该）。如果 `public/` 进入了 working tree，确认 `.gitignore` 是否需要补一行 `public/`，然后再决定是否补一个清理 commit（**不要在没确认的情况下 git rm**）。

---

## Self-Review

**Spec coverage** — 对照 [设计文档](docs/plans/2026-05-20-editorial-style-upgrade-design.md) 各节：

| Spec 章节 | 覆盖任务 |
| --- | --- |
| 配色（5 项） | Task 2 Step 1：body bg `#0f0d0a`、主文字 `#e8e2d6`、次文字 `#a89888`、装饰 `#5a4d3d`、灯箱遮罩不动 |
| 字体（系统衬线 + 中文 fallback） | Task 2 Step 1：`.hero-title` Georgia stack、`.hero-subtitle` Songti stack、其他无衬线 |
| 装饰元素（28×1 横线） | Task 2 Step 1：`.hero-divider` 和 `.footer-divider` |
| Hero 内容结构 | Task 1 Step 1：label / title / subtitle / divider / quote / author / scroll |
| Hero 字号尺寸表（桌面+手机） | Task 2 Step 1：明确写出每个 class 的 px 值 + 媒体查询覆盖 |
| 滚动提示动画 + 平滑滚到图墙 | Task 2 Step 1：`@keyframes heroScroll` + `html { scroll-behavior: smooth }` + `<a href="#gallery">` |
| 图墙 gap/padding/minmax 调整 | Task 2 Step 1：桌面 24px/32px/320px、手机 12px/16px/160px |
| Hover 效果改为 opacity 0.7 + scale 0.99 | Task 2 Step 1：`.gallery img:hover` 规则 |
| 页脚（80px 上间距、分隔线、版权字） | Task 1 Step 1（HTML） + Task 2 Step 1（CSS） |
| 灯箱不动 | Task 2 Step 1 中 lightbox 规则与原文一致；Task 1 中 `<div class="lightbox">` 不变；JS 模板不动 |
| 构建命令、文件结构、CNAME | 全部不动 — 改动只在两个模板字符串内 |

无遗漏。

**Placeholder scan** — 已检查全部 step：每个 step 都有具体的代码块或具体命令 + 预期输出，无 TBD/TODO/「类似 Task N」/「适当处理」等占位符。

**Type / 命名一致性** — class 名在 HTML 模板（Task 1）和 CSS 模板（Task 2）中两两对照：`hero` / `hero-inner` / `hero-label` / `hero-title` / `hero-subtitle` / `hero-divider` / `hero-quote` / `hero-author` / `hero-scroll` / `gallery`（已存在） / `site-footer` / `footer-divider` / `footer-text` —— 全部一致；锚点 id `#gallery` 在 hero 链接和 main 元素之间一致。
