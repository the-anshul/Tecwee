/* ============================================================
   main.js — Navbar, Cursor, Hamburger, Forms, Smooth Scroll
   ============================================================ */

/* ============================================================
   1. CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  const cursor      = document.getElementById('cursor');
  const cursorTrail = document.getElementById('cursorTrail');
  if (!cursor || !cursorTrail) return;

  // Hide on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = 0, mouseY = 0;
  let trailX  = 0, trailY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  // Smooth trail
  (function animateTrail() {
    trailX += (mouseX - trailX) * 0.12;
    trailY += (mouseY - trailY) * 0.12;
    cursorTrail.style.left = trailX + 'px';
    cursorTrail.style.top  = trailY + 'px';
    requestAnimationFrame(animateTrail);
  })();

  // Scale up on interactive elements
  const interactives = document.querySelectorAll('a, button, [data-tilt], input, textarea');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform      = 'translate(-50%, -50%) scale(2)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1.4)';
      cursorTrail.style.borderColor = 'rgba(0,245,255,0.25)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform      = 'translate(-50%, -50%) scale(1)';
      cursorTrail.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorTrail.style.borderColor = '';
    });
  });

  // Click pulse
  document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.6)';
  });
  document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });
})();


/* ============================================================
   2. NAVBAR — Scroll class + active state
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Add .scrolled when past 20px
    navbar.classList.toggle('scrolled', scrollY > 20);

    // Hide navbar on fast scroll down, show on scroll up
    if (scrollY > lastScrollY + 8 && scrollY > 100) {
      navbar.style.transform = 'translateY(-100%)';
    } else if (scrollY < lastScrollY - 4) {
      navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = scrollY;
  }, { passive: true });

  navbar.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.4s, box-shadow 0.4s';
})();


/* ============================================================
   3. HAMBURGER MENU
   ============================================================ */
(function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();


/* ============================================================
   4. SMOOTH SCROLL — Offset for fixed navbar
   ============================================================ */
(function initSmoothScroll() {
  const NAV_HEIGHT = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-h'), 10) || 70;

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   5. CONTACT FORM
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn  = form.querySelector('button[type="submit"]');
    const span = btn.querySelector('span');

    // Loading state
    btn.disabled    = true;
    span.textContent = 'Sending...';
    btn.style.opacity = '0.7';

    // Simulate API call
    setTimeout(() => {
      span.textContent = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #00c853, #00e676)';
      btn.style.opacity    = '1';

      // Reset after 3 seconds
      setTimeout(() => {
        form.reset();
        span.textContent  = 'Send Message';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1500);
  });

  // Input float-label effect (visual feedback)
  form.querySelectorAll('input, textarea').forEach((input) => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
  });
})();


/* ============================================================
   6. LOGIN FORM
   ============================================================ */
(function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');

    btn.disabled       = true;
    btn.textContent    = 'Authenticating...';
    btn.style.opacity  = '0.7';

    setTimeout(() => {
      btn.textContent   = '✓ Welcome Back!';
      btn.style.background = 'linear-gradient(135deg, #00c853, #00e676)';
      btn.style.opacity = '1';
      btn.style.color   = '#000';

      setTimeout(() => {
        btn.textContent     = 'Login to Dashboard';
        btn.style.background = '';
        btn.style.color      = '';
        btn.disabled = false;
        form.reset();
      }, 2500);
    }, 1800);
  });
})();


/* ============================================================
   7. SECTION ENTRANCE — Add grid lines / scan effect on page load
   ============================================================ */
(function initPageLoad() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';

  window.addEventListener('load', () => {
    document.body.style.opacity = '1';
  });
})();


/* ============================================================
   8. SERVICE CARDS — Reset tilt transition delay after reveal
   ============================================================ */
(function fixCardTransitionDelay() {
  // After cards are revealed by IntersectionObserver,
  // remove the stagger delay so hover transitions feel instant
  const cards = document.querySelectorAll('.service-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.transitionDelay = '0s';
        }, 700);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card) => observer.observe(card));
})();


/* ============================================================
   9. WINDOW RESIZE — Adjust responsive layout helpers
   ============================================================ */
(function initResizeHandler() {
  let resizeTimer;

  window.addEventListener('resize', () => {
    // Debounce
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Close mobile menu if resizing to desktop
      if (window.innerWidth > 768) {
        const hamburger = document.getElementById('hamburger');
        const navLinks  = document.getElementById('navLinks');
        if (hamburger) hamburger.classList.remove('open');
        if (navLinks)  navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    }, 150);
  });
})();
