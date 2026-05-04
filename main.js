/* ============================================================
   main.js — Navbar, Hamburger, Forms, Scroll Reveal
   ============================================================ */

/* 1. NAVBAR — scroll class */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 10);
    lastY = y;
  }, { passive: true });
})();

/* 2. HAMBURGER */
(function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('navLinks');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    nav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('click', e => {
    const navbar = document.getElementById('navbar');
    if (navbar && !navbar.contains(e.target)) {
      btn.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      btn.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

/* 3. SCROLL REVEAL */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
})();

/* 4. CONTACT FORM */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const span = btn.querySelector('span') || btn;
    const original = span.textContent;
    btn.disabled = true;
    span.textContent = 'Sending…';
    setTimeout(() => {
      span.textContent = '✓ Message sent!';
      btn.style.background = '#16a34a';
      setTimeout(() => {
        span.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    }, 1400);
  });
})();

/* 5. LOGIN FORM */
(function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    setTimeout(() => {
      btn.textContent = '✓ Welcome back!';
      btn.style.background = '#16a34a';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 2500);
    }, 1600);
  });
})();

/* 6. PAGE FADE IN */
(function initFade() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
})();
