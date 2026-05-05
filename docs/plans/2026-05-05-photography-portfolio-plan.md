# 摄影作品展示网站 — 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建极简暗色风格摄影作品展示静态网站，构建脚本扫描图片文件夹自动生成 HTML。

**Architecture:** Node 脚本扫描 `photos/` 目录 → 生成 `public/` 静态站点。CSS Grid 自适应网格 + 原生 JS 灯箱。零运行时依赖。

**Tech Stack:** Node.js（仅构建阶段），纯 HTML/CSS/原生 JS（运行时）

---

### Task 1: 初始化项目和目录结构

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `scripts/build.js`（空文件）
- Create: `photos/.gitkeep`

**Step 1: 创建 package.json**

```bash
cd c:/Users/tqj/Desktop/ownWeb && npm init -y
```

**Step 2: 修改 package.json，添加 build 脚本**

编辑 `package.json`，确保 scripts 字段包含：
```json
"scripts": {
  "build": "node scripts/build.js"
}
```

**Step 3: 创建 .gitignore**

```
node_modules/
.DS_Store
```

**Step 4: 创建目录结构**

```bash
mkdir -p scripts photos public/photos
touch photos/.gitkeep
```

**Step 5: 初始化 git 并提交**

```bash
git init
git add -A
git commit -m "chore: init project structure"
```

---

### Task 2: 构建脚本 — 扫描与文件复制

**Files:**
- Create: `scripts/build.js`

**Step 1: 编写构建脚本**

```javascript
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'photos');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_PHOTOS = path.join(PUBLIC_DIR, 'photos');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function getPhotos() {
  return fs.readdirSync(PHOTOS_DIR)
    .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
}

function build() {
  const photos = getPhotos();
  console.log(`Found ${photos.length} photos`);

  // Clear and recreate public
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_PHOTOS, { recursive: true });

  // Copy photos
  for (const photo of photos) {
    fs.copyFileSync(
      path.join(PHOTOS_DIR, photo),
      path.join(PUBLIC_PHOTOS, photo)
    );
    console.log(`  Copied: ${photo}`);
  }

  // Generate index.html
  const imgTags = photos
    .map(p => `      <img src="photos/${p}" alt="${p}" loading="lazy">`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>摄影作品</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="gallery">
${imgTags}
  </div>
  <div class="lightbox" id="lightbox">
    <img id="lightbox-img" src="" alt="">
  </div>
  <script src="lightbox.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), html);
  console.log('Generated: index.html');

  // Copy static assets
  // (will be handled in later tasks)
}

build();
```

**Step 2: 复制 style.css 和 lightbox.js（目前先创建占位文件）**

```bash
touch public/style.css public/lightbox.js
```

**Step 3: 放一张测试图片并运行构建**

```bash
# 手动把任意 .jpg 放入 photos/ 目录后：
npm run build
```

期望输出：找到 N 张图片，复制并生成 index.html。

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add build script with photo scanning and HTML generation"
```

---

### Task 3: CSS 样式 — 暗色主题 + 响应式网格

**Files:**
- Modify: `scripts/build.js`（加入 CSS 写入）
- 实际编辑: 构建脚本中嵌入 CSS 字符串

**Step 1: 在 build.js 中添加 CSS 生成**

在 `build()` 函数末尾（`build()` 调用之前）添加 `writeStaticAssets()` 函数和调用：

```javascript
function writeStaticAssets() {
  const css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0d0d0d;
  color: #ccc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 4px;
  padding: 4px;
}

.gallery img {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  transition: opacity 0.2s;
  object-fit: cover;
  aspect-ratio: attr(width) / attr(height);
}

.gallery img:hover {
  opacity: 0.85;
}

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

@media (max-width: 600px) {
  .gallery {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 2px;
    padding: 2px;
  }
}
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'style.css'), css);
  console.log('Generated: style.css');
}
```

**Step 2: 在 build() 函数中调用 writeStaticAssets()**

在 `build()` 函数末尾 `console.log('Generated: index.html');` 之后添加：
```javascript
  writeStaticAssets();
```

**Step 3: 运行构建验证**

```bash
npm run build
```

验证 `public/style.css` 已生成且包含暗色背景、grid 布局、lightbox 样式。

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add dark theme CSS with responsive grid and lightbox styling"
```

---

### Task 4: 灯箱 JavaScript

**Files:**
- Modify: `scripts/build.js`（加入 JS 写入）

**Step 1: 在 build.js 的 writeStaticAssets() 中添加 JS 写入**

```javascript
function writeStaticAssets() {
  // ... CSS 代码（上一步的内容）...

  const js = `(function() {
  const gallery = document.querySelector('.gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const images = Array.from(gallery.querySelectorAll('img'));
  let currentIndex = -1;

  // Create nav arrows and counter
  const prevBtn = document.createElement('div');
  prevBtn.className = 'nav-prev';
  prevBtn.innerHTML = '&#8249;';
  const nextBtn = document.createElement('div');
  nextBtn.className = 'nav-next';
  nextBtn.innerHTML = '&#8250;';
  const counter = document.createElement('div');
  counter.className = 'counter';
  lightbox.appendChild(prevBtn);
  lightbox.appendChild(nextBtn);
  lightbox.appendChild(counter);

  function open(index) {
    currentIndex = index;
    lightboxImg.src = images[index].src;
    lightbox.classList.add('active');
    counter.textContent = (index + 1) + ' / ' + images.length;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    open(currentIndex);
  }

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
    open(currentIndex);
  }

  gallery.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
      open(images.indexOf(e.target));
    }
  });

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox || e.target === prevBtn) {
      if (e.target === prevBtn) prev();
      else close();
    }
    if (e.target === nextBtn) next();
  });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  // Touch swipe on mobile
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  });
  lightbox.addEventListener('touchend', function(e) {
    if (!lightbox.classList.contains('active')) return;
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  });
})();
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'lightbox.js'), js);
  console.log('Generated: lightbox.js');
}
```

**Step 2: 同时更新 build.js 顶部 build() 函数中对 writeStaticAssets 的调用，确保位置正确**

无需额外操作，上一步已在 CSS 写入后追加 JS 写入。

**Step 3: 运行构建验证**

```bash
npm run build
```

验证 `public/lightbox.js` 已生成。

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add lightbox with keyboard nav and touch swipe"
```

---

### Task 5: 端到端验证

**Step 1: 确保至少有一张测试图片在 photos/ 目录**

```bash
ls photos/
```

如果没有图片，放一张进去。

**Step 2: 运行构建**

```bash
npm run build
```

期望输出：
```
Found N photos
  Copied: xxx.jpg
Generated: index.html
Generated: style.css
Generated: lightbox.js
```

**Step 3: 检查产物结构**

```bash
ls -R public/
```

期望看到：
```
public/
├── index.html
├── style.css
├── lightbox.js
└── photos/
    ├── xxx.jpg
```

**Step 4: 本地预览（可选）**

```bash
npx serve public/
```

浏览器打开后验证：暗色背景、照片网格、点击放大灯箱、键盘/触摸切换。

**Step 5: 提交**

```bash
git add -A
git commit -m "chore: finalize build with all assets"
```

---

### 最终产物

运行 `npm run build` 后，`public/` 目录即为完整站点，可直接部署到任意静态托管服务。
