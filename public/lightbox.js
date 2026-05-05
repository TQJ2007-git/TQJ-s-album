(function() {
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
