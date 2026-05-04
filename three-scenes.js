/* ============================================================
   three-scenes.js — All Three.js 3D Canvas Scenes
   Requires Three.js r128 loaded before this file
   ============================================================ */

/* ============================================================
   1. HERO — Floating Particle Network
   ============================================================ */
(function initHeroScene() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 80;

  // ---- Particles ----
  const PARTICLE_COUNT = window.innerWidth < 480 ? 60 : 120;
  const positions = [];
  const velocities = [];
  const particleData = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 60;
    positions.push(x, y, z);
    velocities.push(
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.03
    );
    particleData.push({ x, y, z });
  }

  const geo = new THREE.BufferGeometry();
  const posArr = new Float32Array(positions);
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x00f5ff,
    size: 0.9,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ---- Connection Lines ----
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f5ff,
    transparent: true,
    opacity: 0.12,
  });

  const lineGroup = new THREE.Group();
  scene.add(lineGroup);

  function updateLines() {
    // Clear old lines
    while (lineGroup.children.length) {
      lineGroup.remove(lineGroup.children[0]);
    }

    const pos = geo.attributes.position.array;
    const MAX_DIST = 28;
    const MAX_LINES = 80;
    let lineCount = 0;

    for (let i = 0; i < PARTICLE_COUNT && lineCount < MAX_LINES; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && lineCount < MAX_LINES; j++) {
        const dx = pos[i * 3]     - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MAX_DIST) {
          const lineGeo = new THREE.BufferGeometry();
          const pts = new Float32Array([
            pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
            pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2],
          ]);
          lineGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
          const opacity = (1 - dist / MAX_DIST) * 0.2;
          const lm = new THREE.LineBasicMaterial({ color: 0x00f5ff, transparent: true, opacity });
          lineGroup.add(new THREE.Line(lineGeo, lm));
          lineCount++;
        }
      }
    }
  }

  // ---- Mouse interaction ----
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- Resize ----
  function resize() {
    const w = canvas.parentElement.clientWidth || window.innerWidth;
    const h = canvas.parentElement.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- Animate ----
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    const pos = geo.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      // Boundary wrap
      if (pos[i * 3]     >  70) pos[i * 3]     = -70;
      if (pos[i * 3]     < -70) pos[i * 3]     =  70;
      if (pos[i * 3 + 1] >  50) pos[i * 3 + 1] = -50;
      if (pos[i * 3 + 1] < -50) pos[i * 3 + 1] =  50;
      if (pos[i * 3 + 2] >  30) pos[i * 3 + 2] = -30;
      if (pos[i * 3 + 2] < -30) pos[i * 3 + 2] =  30;
    }
    geo.attributes.position.needsUpdate = true;

    // Update lines every 3 frames for performance
    if (frame % 3 === 0) updateLines();

    // Gentle camera drift following mouse
    camera.position.x += (mouse.x * 6 - camera.position.x) * 0.015;
    camera.position.y += (-mouse.y * 4 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();


/* ============================================================
   2. ABOUT — Spinning Wireframe Globe
   ============================================================ */
(function initAboutScene() {
  const canvas = document.getElementById('aboutCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3.2;

  // Outer wireframe sphere
  const sphereGeo = new THREE.SphereGeometry(1.1, 20, 20);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x00f5ff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // Inner torus
  const torusGeo = new THREE.TorusGeometry(0.75, 0.015, 8, 60);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.5 });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.rotation.x = Math.PI / 2;
  scene.add(torus);

  // Second torus tilted
  const torus2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.012, 8, 60),
    new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.35 })
  );
  torus2.rotation.x = Math.PI / 3;
  torus2.rotation.z = Math.PI / 5;
  scene.add(torus2);

  // Core glow sphere
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.06 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), coreMat);
  scene.add(core);

  // Particles on sphere surface
  const dotCount = 120;
  const dotGeo = new THREE.BufferGeometry();
  const dotPos = new Float32Array(dotCount * 3);
  for (let i = 0; i < dotCount; i++) {
    const phi   = Math.acos(-1 + (2 * i) / dotCount);
    const theta = Math.sqrt(dotCount * Math.PI) * phi;
    dotPos[i * 3]     = 1.12 * Math.cos(theta) * Math.sin(phi);
    dotPos[i * 3 + 1] = 1.12 * Math.sin(theta) * Math.sin(phi);
    dotPos[i * 3 + 2] = 1.12 * Math.cos(phi);
  }
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0x00f5ff, size: 0.03, transparent: true, opacity: 0.9
  }));
  scene.add(dots);

  // ---- Resize ----
  function resize() {
    const size = canvas.parentElement ? canvas.parentElement.clientWidth : 300;
    renderer.setSize(size, size, false);
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- Animate ----
  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.003;
    sphere.rotation.x += 0.001;
    torus.rotation.z  += 0.008;
    torus2.rotation.y += 0.005;
    dots.rotation.y   += 0.003;
    renderer.render(scene, camera);
  }
  animate();
})();


/* ============================================================
   3. CONTACT — Animated Wave Grid
   ============================================================ */
(function initContactScene() {
  const canvas = document.getElementById('contactCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(1); // keep perf light

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 500);
  camera.position.set(0, 18, 30);
  camera.lookAt(0, 0, 0);

  const COLS = window.innerWidth < 600 ? 20 : 35;
  const ROWS = window.innerWidth < 600 ? 12 : 20;
  const SPACING = 1.6;

  const gridGeo = new THREE.BufferGeometry();
  const gridPos = new Float32Array(COLS * ROWS * 3);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = (r * COLS + c) * 3;
      gridPos[i]     = (c - COLS / 2) * SPACING;
      gridPos[i + 1] = 0;
      gridPos[i + 2] = (r - ROWS / 2) * SPACING;
    }
  }
  gridGeo.setAttribute('position', new THREE.BufferAttribute(gridPos, 3));

  const gridMat = new THREE.PointsMaterial({
    color: 0x00f5ff,
    size: 0.12,
    transparent: true,
    opacity: 0.7,
  });
  const grid = new THREE.Points(gridGeo, gridMat);
  scene.add(grid);

  // Build horizontal lines across grid
  const lineGroup = new THREE.Group();
  scene.add(lineGroup);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.12 });

  for (let r = 0; r < ROWS; r++) {
    const pts = [];
    for (let c = 0; c < COLS; c++) {
      pts.push(new THREE.Vector3(
        (c - COLS / 2) * SPACING,
        0,
        (r - ROWS / 2) * SPACING
      ));
    }
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    lineGroup.add(new THREE.Line(lg, lineMat));
  }

  // Resize
  function resize() {
    const w = canvas.parentElement ? canvas.parentElement.clientWidth  : window.innerWidth;
    const h = canvas.parentElement ? canvas.parentElement.clientHeight : 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.018;

    const pos = gridGeo.attributes.position.array;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = (r * COLS + c) * 3;
        const x = pos[i];
        const z = pos[i + 2];
        pos[i + 1] = Math.sin(x * 0.4 + t) * 1.1 + Math.cos(z * 0.35 + t * 0.8) * 0.9;
      }
    }
    gridGeo.attributes.position.needsUpdate = true;

    // Update line y positions too
    lineGroup.children.forEach((line, r) => {
      const lp = line.geometry.attributes.position.array;
      for (let c = 0; c < COLS; c++) {
        const gi = (r * COLS + c) * 3;
        lp[c * 3 + 1] = pos[gi + 1];
      }
      line.geometry.attributes.position.needsUpdate = true;
    });

    renderer.render(scene, camera);
  }
  animate();
})();
