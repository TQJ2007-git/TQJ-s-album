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

  const js = `(function() {
  const gallery = document.querySelector('.gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const images = Array.from(gallery.querySelectorAll('img'));
  let currentIndex = -1;

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
    lightboxImg.src = images[index].dataset.full;
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

build().catch(err => {
  console.error(err);
  process.exit(1);
});
