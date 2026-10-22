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

    const scrollByOneSlide = (direction) => {
      const slide = track.querySelector('.carousel-slide');
      const slideWidth = slide ? slide.getBoundingClientRect().width + 16 : 300;
      track.scrollBy({ left: direction * slideWidth, behavior: 'smooth' });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => scrollByOneSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByOneSlide(1));
  });

  // Scroll reveal: pieces of the page fade and slide up as they enter the screen,
  // and fade back out as they leave (at the top or bottom), so it replays in both directions.
  // To animate another element, add its CSS selector to the list below.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    // Small pieces animate one by one (not whole cards), so you see motion all the way down the page.
    const targets = Array.from(document.querySelectorAll(
      '.about .section-title, .about-grid p, .work > .section-title, ' +
      '.project-header, .project-desc, .stats, .tags, ' +
      '.subproject > h4, .subproject > p, .subproject .carousel, .subproject .single-image, ' +
      '.subproject .video-embed, .subproject > .btn, .artist-group h5, .audio-item, ' +
      '.experience .section-title, .exp-card, .contact > *'
    ));

    // The "band" is the middle of the screen: a piece is visible while any part of it is inside.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { rootMargin: '-12% 0px -10% 0px' });

    targets.forEach((el) => {
      el.classList.add('reveal');
      if (el.classList.contains('exp-card')) {
        el.style.transitionDelay = (Array.from(el.parentNode.children).indexOf(el) % 2) * 100 + 'ms';
      }
      observer.observe(el);
    });
  }
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
      '<p class="lightbox-caption"></p>' +
      '<button class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(box);

    const bigImg = box.querySelector('.lightbox-img');
    const caption = box.querySelector('.lightbox-caption');
    const prevBtn = box.querySelector('.lightbox-prev');
    const nextBtn = box.querySelector('.lightbox-next');
    let group = [];
    let index = 0;

    const show = (i) => {
      index = (i + group.length) % group.length;
      bigImg.src = group[index].currentSrc || group[index].src;
      bigImg.alt = group[index].alt;
      caption.textContent = group[index].alt;
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
    box.addEventListener('close', () => document.documentElement.classList.remove('lightbox-open'));
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
