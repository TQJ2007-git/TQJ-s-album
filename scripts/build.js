const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'photos');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PUBLIC_PHOTOS = path.join(PUBLIC_DIR, 'photos');
const THUMB_DIR = path.join(PUBLIC_PHOTOS, 'thumb');
const FULL_DIR = path.join(PUBLIC_PHOTOS, 'full');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const THUMB_WIDTH = 400;
const FULL_WIDTH = 1200;
const THUMB_QUALITY = 80;
const FULL_QUALITY = 85;

function getPhotos() {
  return fs.readdirSync(PHOTOS_DIR)
    .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
}

async function processImage(photo) {
  const input = path.join(PHOTOS_DIR, photo);
  const name = path.parse(photo).name + '.webp';
  const metadata = await sharp(input).metadata();

  const thumbOut = path.join(THUMB_DIR, name);
  const fullOut = path.join(FULL_DIR, name);

  const thumbPipeline = sharp(input).webp({ quality: THUMB_QUALITY });
  const fullPipeline = sharp(input).webp({ quality: FULL_QUALITY });

  if (metadata.width > THUMB_WIDTH) {
    thumbPipeline.resize(THUMB_WIDTH);
  }
  if (metadata.width > FULL_WIDTH) {
    fullPipeline.resize(FULL_WIDTH);
  }

  await Promise.all([
    thumbPipeline.toFile(thumbOut),
    fullPipeline.toFile(fullOut),
  ]);

  const thumbStat = fs.statSync(thumbOut);
  const fullStat = fs.statSync(fullOut);
  const origStat = fs.statSync(input);

  console.log(`  ${photo} (${(origStat.size / 1024).toFixed(0)}KB)`);
  console.log(`    thumb: ${name} (${(thumbStat.size / 1024).toFixed(0)}KB)`);
  console.log(`    full:  ${name} (${(fullStat.size / 1024).toFixed(0)}KB)`);
}

async function build() {
  const photos = getPhotos();
  console.log(`Found ${photos.length} photos\n`);

  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  fs.mkdirSync(FULL_DIR, { recursive: true });

  const processedPhotos = [];
  for (const photo of photos) {
    await processImage(photo);
    processedPhotos.push(photo);
    console.log('');
  }

  const imgTags = processedPhotos
    .map(p => {
      const webpName = path.parse(p).name + '.webp';
      return `      <img src="photos/thumb/${webpName}" alt="${p}" data-full="photos/full/${webpName}" loading="lazy">`;
    })
    .join('\n');

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
      <div class="hero-label" lang="en">PORTFOLIO · 2026</div>
      <h1 class="hero-title" lang="en">Album</h1>
      <div class="hero-subtitle">摄影作品</div>
      <div class="hero-divider"></div>
      <p class="hero-quote" lang="en">You will never walk alone</p>
      <div class="hero-author">— tqj</div>
    </div>
    <a href="#gallery" class="hero-scroll" lang="en">↓ SCROLL</a>
  </section>
  <main id="gallery" class="gallery">
${imgTags}
  </main>
  <footer class="site-footer">
    <div class="footer-divider"></div>
    <div class="footer-text" lang="en">© 2026 tqj</div>
  </footer>
  <div class="lightbox" id="lightbox">
    <img id="lightbox-img" src="" alt="">
  </div>
  <script src="lightbox.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), html);
  console.log('Generated: index.html');

  fs.writeFileSync(path.join(PUBLIC_DIR, 'CNAME'), 'tqj-s-album.site');

  writeStaticAssets();

  const totalSize = getDirSize(PUBLIC_DIR);
  console.log(`\nTotal public size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
}

function getDirSize(dir) {
  let size = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getDirSize(p);
    } else {
      size += fs.statSync(p).size;
    }
  }
  return size;
}

function writeStaticAssets() {
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
  color: #8a7a6a;
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
  color: #8a7a6a;
  font-size: 11px;
  letter-spacing: 4px;
  text-decoration: none;
  animation: heroScroll 1.5s ease-in-out infinite;
}

.hero-scroll:focus-visible {
  outline: 2px solid #a89888;
  outline-offset: 4px;
  border-radius: 2px;
}

@keyframes heroScroll {
  0%, 100% { transform: translate(-50%, 0); }
  50%      { transform: translate(-50%, 4px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll {
    animation: none;
  }
  .gallery img {
    transition: none;
  }
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
  -webkit-user-drag: none;
  transition: filter 0.2s ease;
}

.lightbox img.loading {
  filter: blur(8px);
}

.lightbox .nav-prev,
.lightbox .nav-next,
.lightbox .nav-close {
  position: absolute;
  background: rgba(0, 0, 0, 0.35);
  border: none;
  color: #fff;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s, opacity 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.lightbox .nav-prev,
.lightbox .nav-next {
  top: 50%;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  font-size: 28px;
  line-height: 1;
  transform: translateY(-50%);
  opacity: 0.7;
}

.lightbox .nav-prev { left: 16px; }
.lightbox .nav-next { right: 16px; }

.lightbox .nav-prev:hover,
.lightbox .nav-next:hover {
  background: rgba(0, 0, 0, 0.6);
  opacity: 1;
}

.lightbox .nav-prev:focus-visible,
.lightbox .nav-next:focus-visible,
.lightbox .nav-close:focus-visible {
  outline: 2px solid #e8e2d6;
  outline-offset: 2px;
  opacity: 1;
}

.lightbox .nav-close {
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  opacity: 0.7;
}

.lightbox .nav-close:hover {
  background: rgba(0, 0, 0, 0.6);
  opacity: 1;
}

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

  .lightbox {
    touch-action: pan-y;
  }

  .lightbox .nav-prev,
  .lightbox .nav-next {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }

  .lightbox .nav-prev { left: 8px; }
  .lightbox .nav-next { right: 8px; }

  .lightbox .nav-close {
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .lightbox .counter {
    bottom: 12px;
    font-size: 0.8rem;
  }
}
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'style.css'), css);
  console.log('Generated: style.css');

  const js = `(function() {
  const gallery = document.querySelector('.gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const images = Array.from(gallery.querySelectorAll('img'));
  let currentIndex = -1;
  let loadToken = 0;
  const fullCache = new Set();

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'nav-prev';
  prevBtn.setAttribute('aria-label', '上一张');
  prevBtn.innerHTML = '&#8249;';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'nav-next';
  nextBtn.setAttribute('aria-label', '下一张');
  nextBtn.innerHTML = '&#8250;';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav-close';
  closeBtn.setAttribute('aria-label', '关闭');
  closeBtn.innerHTML = '&times;';
  const counter = document.createElement('div');
  counter.className = 'counter';
  lightbox.appendChild(prevBtn);
  lightbox.appendChild(nextBtn);
  lightbox.appendChild(closeBtn);
  lightbox.appendChild(counter);

  function preload(index) {
    const url = images[index].dataset.full;
    if (fullCache.has(url)) return;
    const img = new Image();
    img.onload = function() { fullCache.add(url); };
    img.src = url;
  }

  function open(index) {
    currentIndex = index;
    const thumb = images[index];
    const fullUrl = thumb.dataset.full;
    const token = ++loadToken;

    lightboxImg.src = thumb.src;
    lightboxImg.classList.add('loading');
    lightbox.classList.add('active');
    counter.textContent = (index + 1) + ' / ' + images.length;
    document.body.style.overflow = 'hidden';

    if (fullCache.has(fullUrl)) {
      lightboxImg.src = fullUrl;
      lightboxImg.classList.remove('loading');
    } else {
      const loader = new Image();
      loader.onload = function() {
        if (token !== loadToken) return;
        fullCache.add(fullUrl);
        lightboxImg.src = fullUrl;
        lightboxImg.classList.remove('loading');
      };
      loader.onerror = function() {
        if (token !== loadToken) return;
        lightboxImg.classList.remove('loading');
      };
      loader.src = fullUrl;
    }

    preload((index + 1) % images.length);
    preload((index - 1 + images.length) % images.length);
  }

  function close() {
    lightbox.classList.remove('active');
    lightboxImg.classList.remove('loading');
    document.body.style.overflow = '';
  }

  function prev() {
    open((currentIndex - 1 + images.length) % images.length);
  }

  function next() {
    open((currentIndex + 1) % images.length);
  }

  gallery.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
      open(images.indexOf(e.target));
    }
  });

  prevBtn.addEventListener('click', function(e) { e.stopPropagation(); prev(); });
  nextBtn.addEventListener('click', function(e) { e.stopPropagation(); next(); });
  closeBtn.addEventListener('click', function(e) { e.stopPropagation(); close(); });

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox || e.target === lightboxImg) close();
  });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  lightbox.addEventListener('touchstart', function(e) {
    if (!lightbox.classList.contains('active')) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchActive = true;
  }, { passive: true });
  lightbox.addEventListener('touchmove', function(e) {
    if (!touchActive) return;
    const dx = Math.abs(e.changedTouches[0].screenX - touchStartX);
    const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
    if (dx > dy && dx > 10 && e.cancelable) e.preventDefault();
  }, { passive: false });
  lightbox.addEventListener('touchend', function(e) {
    if (!touchActive) return;
    touchActive = false;
    const dx = touchStartX - e.changedTouches[0].screenX;
    const dy = touchStartY - e.changedTouches[0].screenY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      dx > 0 ? next() : prev();
    }
  });
  lightbox.addEventListener('touchcancel', function() { touchActive = false; });
})();
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'lightbox.js'), js);
  console.log('Generated: lightbox.js');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
