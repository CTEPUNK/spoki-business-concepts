'use strict';
// Exhibition model. World units are centimetres; Y is up, +Z is the entrance.
// The original 2D canvas stays intact until the first successful GPU frame.
(() => {
  const host = document.querySelector('.hero [data-scene="pavilion"]');
  const T = window.Artmaket3D;
  if (!host || !T) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'pavilion-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  let renderer;
  try {
    renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch (_) {
    canvas.remove();
    return;
  }
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x103c4b, 0);
  const scene = new T.Scene();
  const model = new T.Group();
  scene.add(model);
  const camera = new T.OrthographicCamera(-22, 22, 22, -22, 0.1, 200);
  scene.add(new T.HemisphereLight(0xe4f4ff, 0x8a7964, 1.5));
  const sun = new T.DirectionalLight(0xffecd4, 2.3);
  sun.position.set(-22, 38, 24);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {
    left: -25,
    right: 25,
    top: 25,
    bottom: -25,
    near: 1,
    far: 100,
  });
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00015;
  sun.shadow.radius = 3;
  scene.add(sun);
  const material = (color, roughness = 0.8) => new T.MeshStandardMaterial({ color, roughness });
  const plaster = material(0xf3f0df);
  const stone = material(0xd5d7cd);
  const wood = material(0xbb8a55);
  const ply = material(0x795735);
  const leaf = material(0x7c9172);
  const trunk = material(0x77624b);
  const burgundy = material(0x733e46);
  // Procedural sky reflection: no image downloads and no opaque flat blue walls.
  const reflection = document.createElement('canvas');
  reflection.width = 64;
  reflection.height = 128;
  const ctx = reflection.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 20, 128);
  gradient.addColorStop(0, '#163946');
  gradient.addColorStop(0.47, '#234b55');
  gradient.addColorStop(0.49, '#60858b');
  gradient.addColorStop(1, '#afc2bf');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 128);
  const texture = new T.CanvasTexture(reflection);
  texture.colorSpace = T.SRGBColorSpace;
  const glass = new T.MeshStandardMaterial({
    map: texture,
    roughness: 0.24,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  });
  const unitBox = new T.BoxGeometry(1, 1, 1);
  function mesh(geometry, mat, parent = model) {
    const item = new T.Mesh(geometry, mat);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function box(x, y, z, w, h, d, mat, parent = model) {
    const item = mesh(unitBox, mat, parent);
    item.position.set(x, y, z);
    item.scale.set(w, h, d);
    return item;
  }
  // Rounded plan extruded vertically, shared by walls, terrace and roof plates.
  function rounded(w, d, radius, height) {
    const x = -w / 2,
      z = -d / 2,
      r = radius;
    const shape = new T.Shape();
    shape.moveTo(x + r, z);
    shape.lineTo(x + w - r, z);
    shape.quadraticCurveTo(x + w, z, x + w, z + r);
    shape.lineTo(x + w, z + d - r);
    shape.quadraticCurveTo(x + w, z + d, x + w - r, z + d);
    shape.lineTo(x + r, z + d);
    shape.quadraticCurveTo(x, z + d, x, z + d - r);
    shape.lineTo(x, z + r);
    shape.quadraticCurveTo(x, z, x + r, z);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 12,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }
  function slab(x, y, z, w, d, r, h, mat, parent = model) {
    const item = mesh(rounded(w, d, r, h), mat, parent);
    item.position.set(x, y, z);
    return item;
  }
  slab(0, -0.8, 0, 34, 24, 0.7, 1, wood);
  for (let i = 0; i < 5; i++) slab(0, -0.75 + i * 0.18, 0, 34.02, 24.02, 0.7, 0.025, ply);
  slab(0, 0.2, 0, 33.7, 23.7, 0.6, 0.25, plaster);
  slab(0, 0.46, -0.5, 28, 17, 2, 0.4, stone);
  for (let i = 0; i < 4; i++)
    slab(0, 0.46 + i * 0.2, 5.9 - i * 0.4, 18 - i * 0.5, 5 - i * 0.8, 0.4, 0.2, plaster);
  const upper = new T.Group();
  model.add(upper);
  const roof = new T.Group();
  model.add(roof);
  // Two offset pavilions leave a sheltered entrance court between the wings.
  const posts = [];
  for (const [x, z, w, d, height] of [
    [-6, -1.5, 11, 10, 4.6],
    [6, -3, 10, 10, 5.2],
  ]) {
    slab(x, 1, z, w + 0.8, d + 0.8, 2, 0.35, plaster);
    slab(x, 1.35, z, w, d, 2, height, glass);
    box(x, 3.5, z - d / 2 + 0.5, w - 3, 4.3, 0.5, plaster);
    slab(x, 1.35 + height, z, w + 1.5, d + 1.5, 2.3, 0.35, plaster, upper);
    for (let j = 0; j <= 8; j++) {
      posts.push([
        x - w / 2 + 2 + (j * (w - 4)) / 8,
        1.35 + height / 2,
        z + d / 2,
        0.13,
        height,
        0.16,
      ]);
    }
    for (const side of [-1, 1])
      for (let j = 0; j < 5; j++) {
        posts.push([
          x + (side * w) / 2,
          1.35 + height / 2,
          z - d / 2 + 2 + (j * (d - 4)) / 4,
          0.16,
          height,
          0.13,
        ]);
      }
  }
  function instances(transforms, geometry, mat, parent = model) {
    const batch = new T.InstancedMesh(geometry, mat, transforms.length);
    const dummy = new T.Object3D();
    transforms.forEach(([x, y, z, w, h, d, turn = 0], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, turn, 0);
      dummy.updateMatrix();
      batch.setMatrixAt(i, dummy.matrix);
    });
    batch.castShadow = true;
    batch.receiveShadow = true;
    parent.add(batch);
  }
  instances(posts, unitBox, plaster);
  // Fan roof: broad deep lamellae, undulating tips and a clean common support.
  box(0, 7.4, -3.5, 25, 0.35, 0.5, wood, roof);
  for (const x of [-9, -3, 3, 9]) {
    const bottom = x < 0 ? 6.3 : 6.9;
    box(x, (bottom + 7.4) / 2, -3.5, 0.22, 7.4 - bottom, 0.3, plaster, roof);
  }
  const fins = [];
  for (let i = 0; i < 35; i++) {
    const t = i / 34,
      x = -13.4 + t * 26.8;
    const wave = Math.sin(t * Math.PI * 2 - 0.8) * 0.65;
    fins.push([
      x,
      8.1 + wave,
      -1.8,
      0.49,
      0.55 + 0.35 * Math.sin(t * Math.PI),
      13 + Math.sin(t * Math.PI) * 3,
      (t - 0.5) * 0.22,
    ]);
  }
  instances(fins, unitBox, plaster, roof);
  // Warm entrance frame on the front wing, above three shallow steps.
  box(-5, 2.8, 3.62, 2.5, 2.9, 0.28, wood);
  box(-5, 2.65, 3.8, 1.65, 2.5, 0.12, burgundy);
  for (let i = 0; i < 3; i++) box(-5, 0.96 + i * 0.13, 4.6 - i * 0.28, 2.7, 0.18, 0.85, stone);
  // Terrace furniture and tiny people establish the scale.
  for (const [x, z] of [
    [-11, 7],
    [9, 6.8],
  ]) {
    box(x, 1.05, z, 3, 0.18, 0.65, wood);
    for (const dx of [-1.1, 1.1]) box(x + dx, 0.75, z, 0.18, 0.5, 0.5, stone);
  }
  const crowns = [];
  for (const [x, z, s] of [
    [-14, 4, 1],
    [13.5, 3, 0.9],
    [12, -9, 0.8],
    [-13, -9, 0.7],
  ]) {
    const stem = mesh(new T.CylinderGeometry(0.09, 0.16, 2.8, 7), trunk);
    stem.position.set(x, 1.8, z);
    for (let j = 0; j < 5; j++)
      crowns.push([
        x + Math.sin(j * 2.4) * 0.7 * s,
        3.5 + (j % 3) * 0.45 * s,
        z + Math.cos(j * 2.4) * 0.65 * s,
        1.05 * s,
        1.2 * s,
        0.95 * s,
      ]);
  }
  instances(crowns, new T.IcosahedronGeometry(1, 2), leaf);
  for (const [x, z] of [
    [-3, 7],
    [3, 5.8],
    [11, 8],
  ]) {
    const person = mesh(new T.CylinderGeometry(0.16, 0.22, 1.1, 8), burgundy);
    person.position.set(x, 1.1, z);
    const head = mesh(new T.SphereGeometry(0.22, 10, 8), plaster);
    head.position.set(x, 1.85, z);
  }
  const ground = mesh(new T.PlaneGeometry(90, 90), new T.ShadowMaterial({ opacity: 0.22 }), scene);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.84;
  ground.castShadow = false;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true,
    lost = false,
    pending = 0;
  let lastWidth = 0,
    lastHeight = 0,
    lastRatio = Math.min(devicePixelRatio || 1, 1.75);
  let targetX = 0,
    targetY = 0,
    angleX = 0,
    angleY = 0,
    progress = 0;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function state(value) {
    host.dataset.renderer = value;
    host.dispatchEvent(new Event('rendererchange'));
  }
  function schedule() {
    if (!pending && visible && !document.hidden && !lost) pending = requestAnimationFrame(draw);
  }
  function draw() {
    pending = 0;
    if (!visible || document.hidden || lost) return;
    const rect = host.getBoundingClientRect();
    const targetProgress = motion.matches ? 0 : clamp(scrollY / (innerHeight * 0.65), 0, 1);
    angleX += ((motion.matches ? 0 : targetX) - angleX) * 0.12;
    angleY += ((motion.matches ? 0 : targetY) - angleY) * 0.12;
    progress += (targetProgress - progress) * 0.14;
    upper.position.y = progress * 2.2;
    roof.position.y = progress * 5.5;
    const azimuth = 0.43 + angleX * 0.32;
    camera.position.set(Math.sin(azimuth) * 55, 29 + angleY * 5, Math.cos(azimuth) * 55);
    camera.lookAt(0, 3.4 + progress * 1.8, 0);
    const width = Math.max(1, Math.round(rect.width)),
      height = Math.max(1, Math.round(rect.height));
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    if (width !== lastWidth || height !== lastHeight || ratio !== lastRatio) {
      if (ratio !== lastRatio) renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      const aspect = width / height,
        viewHeight = Math.max(29, 44 / aspect);
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      lastWidth = width;
      lastHeight = height;
      lastRatio = ratio;
    }
    try {
      renderer.render(scene, camera);
      if (renderer.getContext().isContextLost()) return;
      if (host.dataset.renderer !== 'webgl') state('webgl');
    } catch (_) {
      lost = true;
      state('canvas2d');
      return;
    }
    canvas.dataset.progress = progress.toFixed(3);
    if (
      Math.abs(angleX - targetX) +
        Math.abs(angleY - targetY) +
        Math.abs(progress - targetProgress) >
        0.002 &&
      !motion.matches
    )
      schedule();
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(pending);
    pending = 0;
    state('canvas2d');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    schedule();
  });
  host.addEventListener(
    'pointermove',
    (event) => {
      if (motion.matches || event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      targetX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      targetY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      schedule();
    },
    { passive: true },
  );
  host.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    schedule();
  });
  new ResizeObserver(schedule).observe(host);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) schedule();
  }).observe(host);
  addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    targetX = targetY = 0;
    schedule();
  });
  schedule();
})();
