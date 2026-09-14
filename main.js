/* ============================================================
   PHINEHAS GENERATION FOUNDATION — Interactions
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     LOADER
     ============================================================ */
  window.addEventListener('load', function () {
    const loader = document.getElementById('loader');
    if (!loader) return;
    setTimeout(function () {
      loader.classList.add('hidden');
      // Prevent interaction after fade
      setTimeout(function () {
        if (loader.parentNode) loader.style.display = 'none';
      }, 900);
    }, 1400);
  });

  /* ============================================================
     CUSTOM CURSOR (desktop only)
     ============================================================ */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    document.addEventListener('mouseleave', function () { cursor.classList.add('hidden'); });
    document.addEventListener('mouseenter', function () { cursor.classList.remove('hidden'); });
    document.querySelectorAll('a, button, .btn, .program-card, .serve-card, .voice, .hero-dot').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hover'); });
    });
  }

  /* ============================================================
     HEADER — scroll behaviour
     ============================================================ */
  const header = document.getElementById('header');
  let lastScroll = 0;
  function handleScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 40);
      if (y > 220 && y > lastScroll) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
    }
    const btt = document.getElementById('backToTop');
    if (btt) btt.classList.toggle('visible', y > 500);
    lastScroll = y;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('navOverlay');

  function openNav() {
    if (!navMenu) return;
    navMenu.classList.add('open');
    if (navOverlay) navOverlay.classList.add('active');
    if (hamburger) {
      const icon = hamburger.querySelector('i');
      if (icon) { icon.classList.remove('fa-bars'); icon.classList.add('fa-times'); }
    }
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    if (!navMenu) return;
    navMenu.classList.remove('open');
    if (navOverlay) navOverlay.classList.remove('active');
    if (hamburger) {
      const icon = hamburger.querySelector('i');
      if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
    }
    document.body.style.overflow = '';
  }
  if (hamburger) hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (navMenu.classList.contains('open')) closeNav();
    else openNav();
  });
  if (navOverlay) navOverlay.addEventListener('click', closeNav);
  document.querySelectorAll('.nav-menu a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ============================================================
     HERO SLIDESHOW
     ============================================================ */
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  let currentSlide = 0;
  let slideTimer = null;
  const SLIDE_DURATION = 5000;

  function goToSlide(index) {
    if (index === currentSlide || index < 0 || index >= slides.length) return;
    slides.forEach(function (s) { s.classList.remove('active'); });
    dots.forEach(function (d) { d.classList.remove('active'); });
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentSlide = index;
  }
  function nextSlide() { goToSlide((currentSlide + 1) % slides.length); }

  function startSlideshow() {
    stopSlideshow();
    slideTimer = setInterval(nextSlide, SLIDE_DURATION);
  }
  function stopSlideshow() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      goToSlide(i);
      startSlideshow();
    });
  });

  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    heroEl.addEventListener('mouseenter', stopSlideshow);
    heroEl.addEventListener('mouseleave', startSlideshow);
  }

  // Touch swipe
  let touchStart = 0;
  if (heroEl) {
    heroEl.addEventListener('touchstart', function (e) {
      touchStart = e.changedTouches[0].screenX;
    }, { passive: true });
    heroEl.addEventListener('touchend', function (e) {
      const diff = touchStart - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
        startSlideshow();
      }
    }, { passive: true });
  }

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); startSlideshow(); }
    else if (e.key === 'ArrowLeft') { goToSlide(currentSlide - 1); startSlideshow(); }
  });

  if (slides.length > 0) startSlideshow();

  /* ============================================================
     PARTICLE CANVAS (hero)
     ============================================================ */
  const canvas = document.getElementById('particles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let rafId;
    let mouseX = -1000, mouseY = -1000;

    function resizeCanvas() {
      const parent = canvas.parentElement;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }

    function initParticles() {
      particles = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(70, Math.max(25, Math.floor(area / 18000)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 0.4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          o: Math.random() * 0.5 + 0.2
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p, i) {
        const dx = mouseX - p.x, dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          p.x += dx * 0.008;
          p.y += dy * 0.008;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,148,62,' + p.o + ')';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx2 = p.x - particles[j].x;
          const dy2 = p.y - particles[j].y;
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(200,148,62,' + (0.05 * (1 - d2 / 100)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      rafId = requestAnimationFrame(animate);
    }

    function handleMouse(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
    if (heroEl) {
      heroEl.addEventListener('mousemove', handleMouse);
      heroEl.addEventListener('mouseleave', function () { mouseX = -1000; mouseY = -1000; });
    }

    let resizeDebounce;
    window.addEventListener('resize', function () {
      clearTimeout(resizeDebounce);
      resizeDebounce = setTimeout(function () {
        resizeCanvas();
        initParticles();
      }, 200);
    });

    resizeCanvas();
    initParticles();
    animate();
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     LAZY IMAGES
     ============================================================ */
  const lazyImages = document.querySelectorAll('img.lazy');
  if ('IntersectionObserver' in window && lazyImages.length) {
    const imgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.addEventListener('load', function () { img.classList.add('loaded'); });
            img.addEventListener('error', function () { img.classList.add('loaded'); });
          }
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    lazyImages.forEach(function (img) { imgObserver.observe(img); });
  } else {
    lazyImages.forEach(function (img) {
      if (img.dataset.src) img.src = img.dataset.src;
      img.classList.add('loaded');
    });
  }

  /* ============================================================
     COUNT-UP NUMBERS (hero stats + impact)
     ============================================================ */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-count]').forEach(animateCount);
  }

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        const q = i.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============================================================
     BACK TO TOP
     ============================================================ */
  const btt = document.getElementById('backToTop');
  if (btt) {
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     SMOOTH SCROLL FOR HASH LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
     ACTIVE NAV STATE
     ============================================================ */
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-menu a').forEach(function (a) {
    const href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

})();
