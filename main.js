/* ============================================================
   main.js — Navbar, Hamburger, Particle Sphere, Scroll Reveal
   ============================================================ */

/* 1. NAVBAR */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
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
    const nb = document.getElementById('navbar');
    if (nb && !nb.contains(e.target)) {
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

/* 3. PARTICLE SPHERE — Central template style */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -1000, y: -1000 };
  const COUNT = 380;
  const RADIUS_BASE = 0.32; // fraction of min(W,H)

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = [];
    const R = Math.min(W, H) * RADIUS_BASE;
    for (let i = 0; i < COUNT; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      // add slight random scatter
      const r = R * (0.85 + Math.random() * 0.3);
      particles.push({
        ox: r * Math.sin(phi) * Math.cos(theta),
        oy: r * Math.sin(phi) * Math.sin(theta),
        oz: r * Math.cos(phi),
        angle: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0004,
        size: 0.8 + Math.random() * 1.2,
      });
    }
  }

  let rotX = 0, rotY = 0, time = 0;

  function project(x, y, z) {
    const fov = 900;
    const zOff = fov + z;
    const scale = fov / zOff;
    const cx = W * 0.62, cy = H * 0.42; // sphere center — right-center like Central
    return { x: cx + x * scale, y: cy + y * scale, scale };
  }

  function rotateY(x, z, angle) {
    return {
      x: x * Math.cos(angle) - z * Math.sin(angle),
      z: x * Math.sin(angle) + z * Math.cos(angle),
    };
  }

  function rotateX(y, z, angle) {
    return {
      y: y * Math.cos(angle) - z * Math.sin(angle),
      z: y * Math.sin(angle) + z * Math.cos(angle),
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    time += 1;

    // gentle auto-rotation
    rotY += 0.003;
    rotX += 0.0008;

    // subtle mouse influence
    const mx = (mouse.x - W * 0.62) / (W * 0.3);
    const my = (mouse.y - H * 0.42) / (H * 0.3);
    const targetRotY = rotY + mx * 0.4;
    const targetRotX = rotX + my * 0.2;

    for (const p of particles) {
      let { ox, oy, oz } = p;

      // rotateY
      const ry = rotateY(ox, oz, targetRotY);
      ox = ry.x; oz = ry.z;
      // rotateX
      const rx = rotateX(oy, oz, targetRotX);
      oy = rx.y; oz = rx.z;

      const proj = project(ox, oy, oz);
      const depth = (oz + Math.min(W, H) * RADIUS_BASE) / (2 * Math.min(W, H) * RADIUS_BASE);
      const alpha = 0.08 + depth * 0.55;
      const size = p.size * proj.scale * 0.5;

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, Math.max(0.3, size), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10,10,10,${alpha.toFixed(2)})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('resize', () => { resize(); createParticles(); });

  resize();
  createParticles();
  draw();
})();

/* 4. SCROLL REVEAL */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
})();

/* 5. CONTACT FORM */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const span = btn.querySelector('span') || btn;
    const orig = span.textContent;
    btn.disabled = true;
    span.textContent = 'Sending…';
    setTimeout(() => {
      span.textContent = '✓ Message sent!';
      btn.style.background = '#16a34a';
      setTimeout(() => { span.textContent = orig; btn.style.background = ''; btn.disabled = false; form.reset(); }, 3000);
    }, 1400);
  });
})();

/* 6. LOGIN FORM */
(function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    setTimeout(() => {
      btn.textContent = '✓ Welcome back!';
      btn.style.background = '#16a34a';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; form.reset(); }, 2500);
    }, 1600);
  });
})();

/* 7. PAGE FADE IN */
(function() {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  window.addEventListener('load', () => { document.body.style.opacity = '1'; });
})();
