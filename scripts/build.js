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

  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC_PHOTOS, { recursive: true });

  for (const photo of photos) {
    fs.copyFileSync(
      path.join(PHOTOS_DIR, photo),
      path.join(PUBLIC_PHOTOS, photo)
    );
    console.log(`  Copied: ${photo}`);
  }

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
}

build();
