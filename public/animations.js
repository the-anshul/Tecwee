/* ============================================================
   animations.js — Scroll Reveals, Counter, Tilt Effect
   ============================================================ */

/* ============================================================
   1. SCROLL REVEAL — Observe elements and animate on viewport
   ============================================================ */
(function initScrollReveal() {
  // Add reveal classes to elements
  const revealMap = [
    { selector: '.section-tag',      cls: 'reveal' },
    { selector: '.section-title',    cls: 'reveal' },
    { selector: '.section-desc',     cls: 'reveal' },
    { selector: '.section-header p', cls: 'reveal' },
    { selector: '.service-card',     cls: 'reveal' },
    { selector: '.about-visual',     cls: 'reveal-left' },
    { selector: '.about-content',    cls: 'reveal-right' },
    { selector: '.contact-info',     cls: 'reveal-left' },
    { selector: '.contact-form',     cls: 'reveal-right' },
    { selector: '.feature-item',     cls: 'reveal' },
    { selector: '.login-box',        cls: 'reveal' },
    { selector: '.footer-inner',     cls: 'reveal' },
    { selector: '.hero-stats .stat', cls: 'reveal' },
    { selector: '.contact-item',     cls: 'reveal' },
  ];

  revealMap.forEach(({ selector, cls }) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add(cls);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
    observer.observe(el);
  });
})();


/* ============================================================
   2. COUNTER ANIMATION — Stats in hero section
   ============================================================ */
(function initCounters() {
  const stats = document.querySelectorAll('.stat[data-count]');
  if (!stats.length) return;

  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const numEl  = el.querySelector('.stat-num');
    if (!numEl) return;

    const duration = 1800;
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased    = 1 - (1 - progress) * (1 - progress);
      numEl.textContent = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        numEl.textContent = target;
      }
    }
    requestAnimationFrame(step);
  }

  // Trigger when hero is visible
  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stats.forEach((stat) => animateCount(stat));
          heroObserver.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );

  const hero = document.querySelector('.hero-stats');
  if (hero) heroObserver.observe(hero);
})();


/* ============================================================
   3. 3D TILT EFFECT — Service cards mouse-follow perspective
   ============================================================ */
(function initTilt() {
  const cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;

  // Skip tilt on touch devices
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) return;

  const MAX_TILT  = 12;  // degrees
  const SCALE     = 1.04;
  const SPEED     = 400; // ms transition

  cards.forEach((card) => {
    card.style.transition = `transform ${SPEED}ms cubic-bezier(0.03,0.98,0.52,0.99)`;
    card.style.willChange = 'transform';
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const cx     = rect.width  / 2;
      const cy     = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -MAX_TILT;
      const rotateY = ((x - cx) / cx) *  MAX_TILT;

      card.style.transform = `
        perspective(800px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(${SCALE}, ${SCALE}, ${SCALE})
      `;

      // Move inner glow with mouse
      const glow = card.querySelector('.card-glow');
      if (glow) {
        glow.style.left   = `${x - 80}px`;
        glow.style.top    = `${y - 80}px`;
        glow.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `
        perspective(800px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
      `;
      const glow = card.querySelector('.card-glow');
      if (glow) glow.style.opacity = '';
    });
  });
})();


/* ============================================================
   4. ACTIVE NAV LINK on scroll — Highlight current section
   ============================================================ */
/* Dynamic active nav logic removed for multi-page structure */


/* ============================================================
   5. TYPING EFFECT — Optional hero subtitle typewriter
   ============================================================ */
(function initTypingCursor() {
  // Adds a blinking cursor after the hero tag text
  const heroTag = document.querySelector('.hero-tag');
  if (!heroTag) return;

  const cursor = document.createElement('span');
  cursor.textContent = '|';
  cursor.style.cssText = `
    display: inline-block;
    margin-left: 2px;
    color: #00f5ff;
    animation: blink 1s step-end infinite;
    font-weight: 300;
  `;
  heroTag.appendChild(cursor);

  // Inject keyframes
  const style = document.createElement('style');
  style.textContent = `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`;
  document.head.appendChild(style);
})();


/* ============================================================
   6. PARALLAX — Subtle parallax on hero title on scroll
   ============================================================ */
(function initParallax() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        heroContent.style.transform = `translateY(${scrollY * 0.25}px)`;
        heroContent.style.opacity   = `${1 - scrollY / 600}`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ============================================================
   7. STAGGER DELAY — Cards animate in sequence on scroll
   ============================================================ */
(function initStaggerDelay() {
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
  });

  const featureItems = document.querySelectorAll('.feature-item');
  featureItems.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.15}s`;
  });

  const contactItems = document.querySelectorAll('.contact-item');
  contactItems.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.12}s`;
  });
})();
