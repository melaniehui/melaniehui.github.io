// Melanie Hui portfolio — small vanilla JS helpers.
// 1) Mobile nav toggle
// 2) Carousel prev/next buttons
// 3) Footer year

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu after tapping a link (mobile)
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Carousels: each .carousel has a .carousel-track plus .prev/.next buttons
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');
    if (!track) return;

    // Arrows loop: at the last slide, "next" jumps back to the first (and the reverse)
    const scrollByOneSlide = (direction) => {
      const slide = track.querySelector('.carousel-slide');
      const slideWidth = slide ? slide.getBoundingClientRect().width + 16 : 300;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const atStart = track.scrollLeft <= 4;
      if (direction > 0 && atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (direction < 0 && atStart) {
        track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: direction * slideWidth, behavior: 'smooth' });
      }
    };

    if (prevBtn) prevBtn.addEventListener('click', () => scrollByOneSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByOneSlide(1));
  });

  // Used by the back-to-top button: skip smooth scrolling for people who prefer reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Click-to-enlarge: tapping any carousel or single image opens it full screen.
  // Arrow keys, swipes, or the arrows step through the same carousel. Esc or a click outside closes it.
  const zoomables = Array.from(document.querySelectorAll('.carousel-slide img, .single-image img'));
  if (zoomables.length && typeof HTMLDialogElement === 'function') {
    const box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Enlarged image');
    box.innerHTML =
      '<button class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(box);

    const bigImg = box.querySelector('.lightbox-img');
    const prevBtn = box.querySelector('.lightbox-prev');
    const nextBtn = box.querySelector('.lightbox-next');
    let group = [];
    let index = 0;

    const show = (i) => {
      index = (i + group.length) % group.length;
      bigImg.src = group[index].currentSrc || group[index].src;
      bigImg.alt = group[index].alt; // read by screen readers, not shown on screen
    };

    const openBox = (img) => {
      const carousel = img.closest('.carousel');
      group = carousel ? Array.from(carousel.querySelectorAll('.carousel-slide img')) : [img];
      show(group.indexOf(img));
      const many = group.length > 1;
      prevBtn.style.display = many ? '' : 'none';
      nextBtn.style.display = many ? '' : 'none';
      box.showModal();
      document.documentElement.classList.add('lightbox-open');
    };

    zoomables.forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge image: ' + img.alt);
      img.addEventListener('click', () => openBox(img));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBox(img);
        }
      });
    });

    box.querySelector('.lightbox-close').addEventListener('click', () => box.close());
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
    box.addEventListener('close', () => {
      document.documentElement.classList.remove('lightbox-open');
      // Move the carousel behind the popup to the photo you were just looking at
      const slide = group[index] && group[index].closest('.carousel-slide');
      const track = slide && slide.closest('.carousel-track');
      if (track) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'auto' });
    });
    box.addEventListener('keydown', (e) => {
      if (group.length > 1 && e.key === 'ArrowLeft') show(index - 1);
      if (group.length > 1 && e.key === 'ArrowRight') show(index + 1);
    });

    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null || group.length < 2) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });
  }

  // Highlights the current section in the top bar and shows the back-to-top button
  const spyLinks = Array.from(document.querySelectorAll('.nav-links > li > a[href^="#"]'));
  const toTop = document.getElementById('toTop');
  let spyQueued = false;

  const updateScroll = () => {
    spyQueued = false;
    let current = null;
    spyLinks.forEach((a) => {
      const section = document.querySelector(a.getAttribute('href'));
      if (section && section.getBoundingClientRect().top <= 140) current = a;
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = spyLinks[spyLinks.length - 1];
    spyLinks.forEach((a) => a.classList.toggle('is-active', a === current));
    if (toTop) toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight * 1.2);
  };

  window.addEventListener('scroll', () => {
    if (!spyQueued) {
      spyQueued = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  updateScroll();

  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
