(function() {
  const gallery = document.querySelector('.gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const images = Array.from(gallery.querySelectorAll('img'));
  let currentIndex = -1;
  let loadToken = 0;
  let crossfadeToken = 0;
  let isTransitioning = false;
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
    if (isTransitioning) return;
    const wasActive = lightbox.classList.contains('active');
    currentIndex = index;
    const thumb = images[index];
    const fullUrl = thumb.dataset.full;
    const token = ++loadToken;
    const cfToken = ++crossfadeToken;

    lightboxImg.classList.add('loading');
    counter.textContent = (index + 1) + ' / ' + images.length;
    document.body.style.overflow = 'hidden';

    function applyFull() {
      if (token !== loadToken) return;
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
    }

    if (wasActive) {
      isTransitioning = true;
      lightboxImg.classList.add('crossfade');
      setTimeout(function() {
        if (cfToken !== crossfadeToken) { isTransitioning = false; return; }
        lightboxImg.src = thumb.src;
        lightboxImg.classList.remove('crossfade');
        applyFull();
        setTimeout(function() {
          if (cfToken === crossfadeToken) isTransitioning = false;
        }, 250);
      }, 200);
    } else {
      lightboxImg.src = thumb.src;
      lightbox.classList.add('active');
      applyFull();
    }

    preload((index + 1) % images.length);
    preload((index - 1 + images.length) % images.length);
  }

  function close() {
    isTransitioning = false;
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
