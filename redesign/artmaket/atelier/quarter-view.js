'use strict';

// Parallel projection. Each piece is built in local plan coordinates on its own removable tile.
function drawQuarter(svg, state, active, landed, sample) {
  const night = state.light === 'eve';
  const lampId = svg.id + '-lamp';
  const shadowId = svg.id + '-shadow';
  const point = (x, y, z = 0) => [340 + (x - y) * 1.46, 81 + (x + y) * 0.65 - z];
  const coords = (p) => p.map((n) => n.toFixed(2)).join(',');
  const polygon = (vertices, color, extra = '') =>
    `<polygon points="${vertices.map((p) => coords(point(...p))).join(' ')}" fill="${color}" ${extra}/>`;
  const line = (a, b, stroke, width = 1) =>
    `<path d="M${coords(point(...a))} L${coords(point(...b))}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
  function ellipse(x, y, z, rx, ry, fill) {
    const [cx, cy] = point(x, y, z);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
  }
  function slab(x, y, z, w, d, h, [top, left, right]) {
    const X = x + w,
      Y = y + d,
      Z = z + h;
    return (
      polygon(
        [
          [x, y, Z],
          [X, y, Z],
          [X, Y, Z],
          [x, Y, Z],
        ],
        top,
      ) +
      polygon(
        [
          [x, Y, Z],
          [X, Y, Z],
          [X, Y, z],
          [x, Y, z],
        ],
        left,
      ) +
      polygon(
        [
          [X, y, Z],
          [X, Y, Z],
          [X, Y, z],
          [X, y, z],
        ],
        right,
      )
    );
  }
  const timber = ['#d1a77c', '#b3815a', '#805c4c'];
  const stone = night ? ['#829393', '#596d70', '#475c60'] : ['#e9dfc7', '#c4b99f', '#9b977f'];
  const frame = ['#e9d4ac', '#c0a480', '#846c58'];
  const glass = night ? ['#cfab7c', '#ffd787', '#edac5e'] : ['#bddbd7', '#70a5ac', '#537e8b'];
  function tree(x, y, height, radius, dark = false) {
    let art = ellipse(x + 2, y, 2, radius * 1.25, radius * 0.36, '#40574655');
    art += slab(x - 1, y - 1, 2, 2, 2, height * 0.72, timber);
    const [cx, cy] = point(x, y, height);
    const tones = dark ? ['#365d51', '#53755b', '#748c62'] : ['#57734e', '#77945e', '#99aa6d'];
    art += `<g transform="translate(${cx} ${cy})">
      <ellipse cy="3" rx="${radius}" ry="${radius * 1.18}" fill="${tones[0]}"/>
      <ellipse cx="-2" rx="${radius * 0.88}" ry="${radius * 1.12}" fill="${tones[1]}"/>
      <ellipse cx="-4" cy="-3" rx="${radius * 0.62}" ry="${radius * 0.87}" fill="${tones[2]}"/>`;
    // Overlapping leaf clusters keep the crown soft at the scale of the model.
    for (let i = 0; i < 25; i++) {
      const angle = i * 2.4;
      const spread = radius * Math.sqrt(i / 27);
      const dx = Math.cos(angle) * spread;
      const dy = Math.sin(angle) * spread * 1.08;
      const shade = dx + dy < -3 ? tones[2] : dx + dy > 5 ? tones[0] : tones[1];
      art += `<circle cx="${dx}" cy="${dy}" r="${radius * (0.24 + (i % 3) * 0.035)}" fill="${shade}"/>`;
    }
    return art + '</g>';
  }
  function bench(x, y, z) {
    return (
      slab(x + 1, y, z, 2, 5, 3, stone) +
      slab(x + 14, y, z, 2, 5, 3, stone) +
      slab(x, y, z + 3, 18, 5, 2, timber) +
      line([x, y + 2, z + 5], [x + 18, y + 2, z + 5], '#987351', 0.8)
    );
  }
  function lantern(x, y) {
    return (
      (night ? ellipse(x, y, 3, 20, 8, `url(#${lampId})`) : '') +
      line([x, y, 2], [x, y, 17], '#425456', 2.2) +
      ellipse(x, y, 17, 2.8, 3.2, night ? '#ffdc8d' : '#ece3cc') +
      (night ? ellipse(x, y, 17, 9, 9, `url(#${lampId})`) : '')
    );
  }
  function pavilion(x, y) {
    let art = slab(x + 6, y + 8, 2, 52, 41, 3, stone);
    art += slab(x + 11, y + 11, 5, 42, 31, 28, glass);
    for (let i = 0; i < 43; i += 7) art += slab(x + 11 + i, y + 42, 5, 1.2, 1, 28, frame);
    for (let i = 0; i < 31; i += 6) art += slab(x + 53, y + 11 + i, 5, 1, 1, 28, frame);
    art += line([x + 11, y + 43, 24], [x + 54, y + 43, 24], '#715f54', 1.5);
    art += slab(x + 7, y + 7, 33, 50, 39, 3, frame);
    const roof = ['#bb7c67', '#9b614e', '#794d42'];
    for (let i = 0; i < 3; i++) {
      const X = x + 8 + i * 16,
        Y = y + 8;
      art +=
        polygon(
          [
            [X, Y, 36],
            [X + 14, Y, 45],
            [X + 14, Y + 36, 45],
            [X, Y + 36, 36],
          ],
          roof[0],
        ) +
        polygon(
          [
            [X, Y + 36, 36],
            [X + 14, Y + 36, 45],
            [X + 14, Y + 36, 36],
          ],
          roof[1],
        ) +
        polygon(
          [
            [X + 14, Y, 45],
            [X + 14, Y + 36, 45],
            [X + 14, Y + 36, 36],
            [X + 14, Y, 36],
          ],
          glass[2],
        );
      for (const offset of [4, 9])
        art += line(
          [X + offset, Y, 36 + offset * 0.64],
          [X + offset, Y + 36, 36 + offset * 0.64],
          roof[1],
          0.7,
        );
    }
    // A low glazed entrance wing and timber canopy step down towards the path.
    art += slab(x + 24, y + 42, 4, 21, 9, 13, glass);
    art += slab(x + 22, y + 40, 17, 25, 13, 2, frame);
    for (let dx = 24; dx < 48; dx += 4) art += slab(x + dx, y + 41, 19, 1.5, 12, 1.1, timber);
    art += slab(x + 25, y + 51, 3, 18, 5, 1.5, stone);
    return art + bench(x + 7, y + 51, 2) + lantern(x + 56, y + 53);
  }
  function grove(x, y) {
    let art = slab(x + 3, y + 3, 2, 58, 54, 1, ['#96a67c', '#768666', '#697962']);
    art += polygon(
      [
        [x + 5, y + 18, 4],
        [x + 17, y + 10, 4],
        [x + 39, y + 42, 4],
        [x + 59, y + 46, 4],
        [x + 59, y + 53, 4],
        [x + 33, y + 48, 4],
      ],
      stone[0],
    );
    for (const [dx, dy, h, r] of [
      [11, 14, 25, 10],
      [30, 9, 34, 13],
      [11, 35, 24, 11],
      [48, 14, 31, 13],
      [23, 48, 28, 12],
      [49, 33, 21, 10],
    ]) {
      art += tree(x + dx, y + dy, h, r, dx % 2 === 0);
    }
    return art + bench(x + 37, y + 51, 3) + lantern(x + 58, y + 48);
  }
  function plaza(x, y) {
    let art = slab(x + 4, y + 4, 2, 56, 52, 1, stone);
    for (let i = 8; i < 55; i += 8) {
      art +=
        line([x + i, y + 4, 3], [x + i, y + 56, 3], '#aa9e88', 0.6) +
        line([x + 4, y + i, 3], [x + 60, y + i, 3], '#aa9e88', 0.6);
    }
    art +=
      bench(x + 8, y + 8, 3) +
      slab(x + 17, y + 19, 3, 30, 23, 3, frame) +
      slab(x + 19, y + 21, 6, 26, 19, 0.7, ['#6aa7ab', '#639799', '#869f99']);
    // Folded brass sculpture rising out of a reflecting pool.
    art +=
      polygon(
        [
          [x + 27, y + 30, 7],
          [x + 33, y + 30, 7],
          [x + 40, y + 29, 33],
          [x + 34, y + 29, 28],
        ],
        '#bc8051',
      ) +
      polygon(
        [
          [x + 34, y + 29, 28],
          [x + 40, y + 29, 33],
          [x + 36, y + 35, 27],
          [x + 26, y + 34, 16],
        ],
        '#e2b57b',
      ) +
      bench(x + 10, y + 48, 3) +
      lantern(x + 55, y + 46);
    return art;
  }

  const drawers = { p: pavilion, g: grove, s: plaza };
  if (sample) {
    svg.innerHTML = drawers[sample](0, 0);
    return;
  }

  let art = `<defs><radialGradient id="${lampId}"><stop stop-color="#ffcf76" stop-opacity=".88"/><stop offset="1" stop-color="#ffbc55" stop-opacity="0"/></radialGradient>
    <filter id="${shadowId}" x="-40%" y="-90%" width="180%" height="280%"><feGaussianBlur stdDeviation="9"/></filter></defs>`;
  art += `<ellipse cx="338" cy="240" rx="220" ry="65" fill="#071d21" opacity=".46" filter="url(#${shadowId})"/>`;
  for (let z = -15; z < 0; z += 3)
    art += slab(-13, -13, z, 200, 200, 3, z % 2 ? timber : ['#caa682', '#d8b993', '#997d66']);
  art += slab(-13, -13, 0, 200, 200, 2, stone);
  // A narrow canal runs along the western bank, with a stepped stone quay.
  art += slab(-11, -10, 2, 10, 194, 1, ['#52858a', '#427379', '#385f69']);
  for (let y = -5; y < 179; y += 9) art += line([-9, y, 3], [-4, y + 2, 3], '#a0c4bf', 0.8);
  art += slab(0, -10, 2, 2, 194, 1, frame);
  const paving = night ? '#526467' : '#b7b1a0';
  art += polygon(
    [
      [80, -10, 2],
      [92, -10, 2],
      [92, 183, 2],
      [80, 183, 2],
    ],
    paving,
  );
  art += polygon(
    [
      [3, 76, 2],
      [184, 76, 2],
      [184, 88, 2],
      [3, 88, 2],
    ],
    paving,
  );
  for (let i = 3; i < 184; i += 8) {
    art += line([i, 77, 2], [i, 87, 2], stone[1], 0.7);
    art += line([81, i, 2], [91, i, 2], stone[1], 0.7);
  }
  // Low bollards, planting beds and a timber promenade run along the water.
  for (let y = 0; y < 177; y += 12) {
    art += slab(2, y, 2, 4, 10, 1.5, timber);
    if (y % 36 === 0) art += slab(1, y, 3, 1.4, 1.4, 5, frame);
  }
  const positions = [
    [9, 6],
    [96, 6],
    [9, 94],
    [96, 94],
  ];
  for (const [index, [x, y]] of positions.entries()) {
    const piece = state.tiles[index];
    art += `<g data-plot="${index}" >`;
    art += slab(x, y, 2, 70, 66, 1.6, ['#c4bf9f', '#a79d88', '#8f8e78']);
    art += polygon(
      [
        [x, y, 4],
        [x + 70, y, 4],
        [x + 70, y + 66, 4],
        [x, y + 66, 4],
      ],
      'none',
      `class="plot-outline" stroke="${index === active ? '#963e4e' : '#a5a086'}" stroke-width="${index === active ? 3.5 : 1}"`,
    );
    if (piece === 'x') {
      for (const [dx, dy] of [
        [8, 8],
        [62, 8],
        [8, 58],
        [62, 58],
      ]) {
        art += ellipse(x + dx, y + dy, 4, 2, 1.1, '#89836f');
      }
    }
    if (drawers[piece])
      art += `<g class="${landed === index ? 'piece-landing' : ''}">${drawers[piece](x + 3, y + 3)}</g>`;
    art += '</g>';
  }
  for (const [x, y] of [
    [84, 0],
    [85, 80],
    [175, 81],
    [84, 170],
  ])
    art += `<g pointer-events="none">${lantern(x, y)}</g>`;
  svg.innerHTML = art;
}
