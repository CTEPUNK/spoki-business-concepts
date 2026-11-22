'use strict';
// Orthographic model renderer. Geometry remains editable as physical parts,
// with camera-facing polygons ordered from back to front on every redraw.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const palettes = {
    matte: ['#f5f4e9', '#bfc9c6', '#dce1d9'],
    edge: ['#e1e4db', '#8dabae', '#bbc9c5'],
    wood: ['#d2b58a', '#947151', '#bb956a'],
    glass: ['#87b2b9', '#315a68', '#54818b'],
    dark: ['#476775', '#1e414e', '#315360'],
    green: ['#a2b09b', '#687f70', '#869b83'],
    burgundy: ['#ac7880', '#663a44', '#8d5361'],
  };
  function build(kind, progress) {
    const parts = [];
    function box(x, y, z, w, d, h, material = 'matte') {
      parts.push({ x, y, z, w, d, h, material });
    }
    function tree(x, y, z, size = 1) {
      box(x - 1, y - 1, z, 2, 2, 12 * size, 'wood');
      box(x - 6 * size, y - 6 * size, z + 10 * size, 12 * size, 12 * size, 12 * size, 'green');
      box(x - 4 * size, y - 4 * size, z + 22 * size, 8 * size, 8 * size, 5 * size, 'green');
    }
    if (kind === 'pavilion') {
      box(-150, -105, -12, 300, 210, 10, 'wood');
      for (let i = 0; i < 3; i++) box(-151, -106, -11 + i * 3, 302, 212, 0.6, 'edge');
      box(-148, -103, -2, 296, 206, 4, 'matte');
      box(-132, -88, 2, 264, 176, 2, 'edge');
      // Lower exhibition hall and the broad terraced first floor.
      const body = progress * 22,
        upper = progress * 47,
        roof = progress * 82;
      box(-100, -61, 5 + body, 184, 112, 4);
      box(-86, -48, 9 + body, 154, 88, 32, 'glass');
      box(-86, -48, 9 + body, 154, 18, 32, 'matte');
      for (let x = -86; x <= 68; x += 14) box(x, 40, 9 + body, 1.8, 2, 32, 'edge');
      for (let y = -45; y < 40; y += 14) box(68, y, 9 + body, 2, 1.8, 32, 'edge');
      for (let x = -100; x < 100; x += 35) box(x, -64, 5 + body, 3, 3, 36);
      box(-111, -73, 41 + upper, 220, 136, 5);
      box(-80, -19, 46 + upper, 126, 66, 29, 'glass');
      box(-80, -19, 46 + upper, 126, 16, 29);
      for (let x = -79; x < 47; x += 14) box(x, 47, 46 + upper, 1.6, 2, 29, 'edge');
      for (let y = -19; y < 46; y += 12) box(46, y, 46 + upper, 2, 1.5, 29, 'edge');
      // Exposed roof beams, deep cantilever, repeated tall lamellae.
      box(-100, -51, 75 + roof, 207, 112, 4);
      box(-96, -46, 79 + roof, 198, 5, 5, 'wood');
      box(-96, 44, 79 + roof, 198, 5, 5, 'wood');
      for (let x = -108; x <= 112; x += 10) box(x, -66, 83 + roof, 3.5, 132, 7);
      for (let x of [-85, 60]) box(x, -41, 46 + upper, 3, 3, 29);
      // Terrace railing and entry stair are actual geometry.
      for (let x = -105; x < 106; x += 18) box(x, -72, 46 + upper, 1, 1, 9, 'edge');
      box(-105, -72, 55 + upper, 210, 1, 1, 'edge');
      for (let i = 0; i < 8; i++) box(85, -54 - i * 5, 4 + i * 4.7, 19, 5, 2, 'matte');
      for (let i = 0; i < 5; i++) box(-45, -90 + i * 4, 4 + i, 62, 4, 1.2);
      box(-127, 65, 4, 217, 4, 1, 'wood');
      tree(-123, 38, 4, 1.2);
      tree(119, 57, 4, 1);
      tree(124, -30, 4, 0.8);
      tree(-122, -65, 4, 0.8);
      for (let [x, y] of [
        [-62, -82],
        [40, -83],
        [113, 6],
      ]) {
        box(x, y, 4, 2, 2, 7, 'burgundy');
        box(x - 0.4, y - 0.4, 11, 2.8, 2.8, 2.8);
      }
    } else if (kind === 'materials') {
      const spread = 1 - progress;
      box(-132, -88, -12, 264, 176, 12, 'wood');
      box(-128 - spread * 30, -84, 4 + spread * 24, 256, 168, 5, 'dark');
      box(-126 + spread * 30, -82, 11 + spread * 49, 252, 164, 4, 'glass');
      box(-124 - spread * 18, -80, 18 + spread * 76, 248, 160, 7, 'matte');
      // Material samples: inlaid grain, glazing mullions, apertures.
      for (let i = 0; i < 6; i++)
        box(-115 - spread * 18 + i * 39, -70, 25 + spread * 76, 2, 140, 0.6, 'edge');
      for (let i = 0; i < 4; i++)
        box(-115 + spread * 30 + i * 70, -74, 15 + spread * 49, 1.5, 147, 1, 'edge');
    } else {
      const peel = progress * 65;
      box(-135, -80, -10, 270, 160, 10, 'wood');
      for (let z of [0, 42, 84]) box(-115, -53, z, 230, 113, 5);
      for (let x of [-103, -35, 35, 103]) for (let y of [-43, 47]) box(x, y, 5, 4, 4, 79, 'edge');
      box(-113, 60 + peel, 5, 226, 3, 79, 'glass');
      for (let x = -113; x <= 113; x += 22.5) box(x, 63 + peel, 5, 2, 3, 79, 'matte');
      for (let z of [5, 44, 82]) box(-113, 64 + peel, z, 228, 4, 2);
      for (let x = -124; x < 126; x += 11) box(x, -65, 89, 4, 136, 6);
      box(-112, -53, 6, 225, 4, 76, 'matte');
      for (let i = 0; i < 6; i++) box(55, -39 + i * 9, 6 + i * 6, 31, 9, 3, 'wood');
    }
    return parts;
  }
  document.querySelectorAll('[data-scene]').forEach((scene) => {
    const canvas = scene.querySelector('canvas'),
      ctx = canvas.getContext('2d');
    if (!ctx) return;
    const kind = scene.dataset.scene;
    let pointerX = 0,
      pointerY = 0,
      pending = false,
      visible = true,
      lastFrameKey = '';
    function schedule() {
      if (!pending) {
        pending = true;
        requestAnimationFrame(draw);
      }
    }
    function draw() {
      pending = false;
      if (!visible || document.hidden || scene.dataset.renderer === 'webgl') return;
      scene.dataset.renderer = 'canvas2d';
      const rect = scene.getBoundingClientRect(),
        w = rect.width,
        h = rect.height;
      if (!w || !h) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const parent = scene.closest('section').getBoundingClientRect();
      let progress =
        kind === 'pavilion'
          ? clamp(-parent.top / (innerHeight * 0.55), 0, 1)
          : clamp((innerHeight - parent.top) / (innerHeight * 0.9), 0, 1);
      if (motion.matches) progress = kind === 'materials' ? 1 : 0;
      const frameKey = [
        w,
        h,
        dpr,
        progress.toFixed(3),
        pointerX.toFixed(3),
        pointerY.toFixed(3),
        motion.matches,
      ].join(':');
      if (frameKey === lastFrameKey) return;
      lastFrameKey = frameKey;
      ctx.clearRect(0, 0, w, h);
      const angle = 0.58 + (motion.matches ? 0 : pointerX * 0.23),
        tilt = 0.52 + (motion.matches ? 0 : pointerY * 0.09);
      const co = Math.cos(angle),
        si = Math.sin(angle);
      function project(x, y, z) {
        return [
          x * co - y * si,
          (x * si + y * co) * tilt - z * 0.96,
          x * si + y * co + (z * tilt) / 0.96,
        ];
      }
      const polygons = [];
      const parts = build(kind, progress);
      for (const b of parts) {
        const { x, y, z, w: width, d, h: height } = b;
        const vertices = [
          [x, y, z],
          [x + width, y, z],
          [x + width, y + d, z],
          [x, y + d, z],
          [x, y, z + height],
          [x + width, y, z + height],
          [x + width, y + d, z + height],
          [x, y + d, z + height],
        ].map((v) => project(...v));
        const colors = palettes[b.material];
        for (const [indices, color] of [
          [[4, 5, 6, 7], colors[0]],
          [[1, 2, 6, 5], colors[1]],
          [[2, 3, 7, 6], colors[2]],
        ]) {
          const points = indices.map((i) => vertices[i]);
          polygons.push({ points, color, depth: points.reduce((sum, v) => sum + v[2], 0) / 4 });
        }
      }
      // Cast directional shadows onto horizontal receiving slabs. Clip each
      // shadow to the receiver in world space, then use the same depth buffer.
      function clip(points, axis, edge, greater) {
        const result = [];
        for (let i = 0; i < points.length; i++) {
          const a = points[i],
            b = points[(i + 1) % points.length];
          const insideA = greater ? a[axis] >= edge : a[axis] <= edge;
          const insideB = greater ? b[axis] >= edge : b[axis] <= edge;
          if (insideA) result.push(a);
          if (insideA !== insideB) {
            const t = (edge - a[axis]) / (b[axis] - a[axis]);
            result.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
          }
        }
        return result;
      }
      for (const receiver of parts.filter((part) => part.w * part.d > 500)) {
        const top = receiver.z + receiver.h;
        for (const caster of parts) {
          if (caster === receiver || caster.z < top || caster.w * caster.d < 100) continue;
          const distance = caster.z + caster.h - top;
          const x = caster.x + distance * 0.38,
            y = caster.y + distance * 0.28;
          let shadow = [
            [x, y],
            [x + caster.w, y],
            [x + caster.w, y + caster.d],
            [x, y + caster.d],
          ];
          for (const [axis, edge, greater] of [
            [0, receiver.x, true],
            [0, receiver.x + receiver.w, false],
            [1, receiver.y, true],
            [1, receiver.y + receiver.d, false],
          ])
            shadow = clip(shadow, axis, edge, greater);
          if (shadow.length < 3) continue;
          const points = shadow.map(([sx, sy]) => project(sx, sy, top + 0.03));
          const rgb = palettes[receiver.material][0]
            .slice(1)
            .match(/../g)
            .map((v) => Math.round(parseInt(v, 16) * 0.83));
          const color = '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
          polygons.push({
            points,
            color,
            depth: points.reduce((sum, v) => sum + v[2], 0) / points.length,
          });
        }
      }
      polygons.sort((a, b) => a.depth - b.depth);
      const points = polygons.flatMap((p) => p.points);
      const minX = Math.min(...points.map((p) => p[0])),
        maxX = Math.max(...points.map((p) => p[0]));
      const minY = Math.min(...points.map((p) => p[1])),
        maxY = Math.max(...points.map((p) => p[1]));
      const scale = Math.min((w * 0.9) / (maxX - minX), (h * 0.84) / (maxY - minY));
      const offsetX = w / 2 - ((minX + maxX) * scale) / 2,
        offsetY = h / 2 - ((minY + maxY) * scale) / 2;
      // Ground contact shadow is kept underneath the physical base.
      ctx.save();
      ctx.translate(w * 0.51, offsetY + project(0, 0, -16)[1] * scale);
      ctx.scale(1, 0.32);
      const shadow = ctx.createRadialGradient(0, 0, 5, 0, 0, w * 0.43);
      shadow.addColorStop(0, 'rgba(0,15,22,.55)');
      shadow.addColorStop(1, 'rgba(0,15,22,0)');
      ctx.fillStyle = shadow;
      ctx.fillRect(-w * 0.48, -w * 0.48, w * 0.96, w * 0.96);
      ctx.restore();
      // A depth buffer resolves long floor slabs, mullions and cantilevers
      // correctly even when their projected faces overlap one another.
      const pixelWidth = canvas.width,
        pixelHeight = canvas.height;
      const raster = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
      const depthBuffer = new Float32Array(pixelWidth * pixelHeight);
      depthBuffer.fill(-Infinity);
      function triangle(a, b, c, color) {
        const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (Math.abs(area) < 0.001) return;
        const left = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
          right = Math.min(pixelWidth - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
        const top = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
          bottom = Math.min(pixelHeight - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
        for (let y = top; y <= bottom; y++)
          for (let x = left; x <= right; x++) {
            const u = ((b[0] - x) * (c[1] - y) - (b[1] - y) * (c[0] - x)) / area;
            const v = ((c[0] - x) * (a[1] - y) - (c[1] - y) * (a[0] - x)) / area;
            const t = 1 - u - v;
            if (u < -0.001 || v < -0.001 || t < -0.001) continue;
            const depth = u * a[2] + v * b[2] + t * c[2],
              index = y * pixelWidth + x;
            if (depth < depthBuffer[index]) continue;
            depthBuffer[index] = depth;
            const pixel = index * 4;
            raster.data[pixel] = color[0];
            raster.data[pixel + 1] = color[1];
            raster.data[pixel + 2] = color[2];
            raster.data[pixel + 3] = 255;
          }
      }
      for (const polygon of polygons) {
        const vertices = polygon.points.map((p) => [
          (offsetX + p[0] * scale) * dpr,
          (offsetY + p[1] * scale) * dpr,
          p[2],
        ]);
        const color = polygon.color
          .slice(1)
          .match(/../g)
          .map((value) => parseInt(value, 16));
        for (let i = 1; i < vertices.length - 1; i++)
          triangle(vertices[0], vertices[i], vertices[i + 1], color);
      }
      ctx.putImageData(raster, 0, 0);
      canvas.dataset.progress = progress.toFixed(3);
    }
    scene.addEventListener(
      'pointermove',
      (event) => {
        if (motion.matches) return;
        if (event.pointerType === 'touch' && event.buttons !== 1) return;
        const rect = scene.getBoundingClientRect();
        pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        pointerY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
        schedule();
      },
      { passive: true },
    );
    scene.addEventListener('pointerleave', () => {
      pointerX = pointerY = 0;
      schedule();
    });
    scene.addEventListener('pointercancel', () => {
      pointerX = pointerY = 0;
      schedule();
    });
    scene.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'touch') {
        pointerX = pointerY = 0;
        schedule();
      }
    });
    new ResizeObserver(schedule).observe(scene);
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: '100px' },
    ).observe(scene);
    scene.addEventListener('rendererchange', () => {
      lastFrameKey = '';
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    motion.addEventListener('change', schedule);
    schedule();
  });
})();
