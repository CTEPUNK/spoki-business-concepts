'use strict';
(() => {
  const plots = ['У истока', 'У аллеи', 'У набережной', 'У сквера'];
  const pieces = { p: 'Павильон', g: 'Роща', s: 'Площадь', x: 'Свободно' };
  const lights = { day: 'День', eve: 'Вечер' };
  const byId = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  function readQuarter() {
    const tiles = params.get('plots');
    const light = params.get('light');
    if (!/^[pgsx]{4}$/.test(tiles || '') || !Object.hasOwn(lights, light)) return null;
    return { tiles: tiles.split(''), light };
  }
  function query(state) {
    return new URLSearchParams({ plots: state.tiles.join(''), light: state.light });
  }
  function replaceAddress(address, entry = history.state) {
    // Browsers may restrict history changes when the demo is opened from disk.
    try {
      if (address === undefined) history.replaceState(entry, '');
      else history.replaceState(entry, '', address);
    } catch (error) {
      if (error.name !== 'SecurityError') throw error;
    }
  }
  function updateAddress(state, hash = location.hash, clearDimensions = false) {
    const url = new URL(location.href);
    if (state) {
      for (const [key, value] of query(state)) {
        if (url.searchParams.get(key) !== value || url.searchParams.getAll(key).length > 1)
          url.searchParams.set(key, value);
      }
    } else {
      const keys = ['plots', 'light'];
      if (clearDimensions) keys.push('object', 'length', 'width', 'scale');
      for (const key of keys) {
        if (url.searchParams.has(key)) url.searchParams.delete(key);
      }
    }
    url.hash = hash;
    if (url.href !== location.href) replaceAddress(url.href);
  }
  function describe(state) {
    const layout = plots.map(
      (name, i) => name.toLowerCase() + ' — ' + pieces[state.tiles[i]].toLowerCase(),
    );
    return (
      lights[state.light] + '. ' + layout.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.'
    );
  }
  function options(container, entries, choose) {
    for (const [code, label] of entries) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.code = code;
      button.textContent = label;
      button.addEventListener('click', () => choose(code));
      container.append(button);
    }
    return (value) => {
      for (const button of container.children) {
        button.setAttribute('aria-pressed', String(button.dataset.code === value));
      }
    };
  }
  // Capture only while a piece is held. Hit-test the visible artwork beneath the ghost.
  function wireTray(tray, scene, drop) {
    let held;
    let blockClick = false;
    function plotAt(event) {
      const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-plot]');
      return scene.contains(tile) ? tile : null;
    }
    function finish() {
      if (!held) return;
      const { button, id, ghost, target, listeners } = held;
      held = null;
      listeners.abort();
      ghost?.remove();
      target?.classList.remove('drop-target');
      if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    }
    function cancel() {
      blockClick = true;
      finish();
    }
    tray.addEventListener(
      'click',
      (event) => {
        if (blockClick && event.detail !== 0) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    tray.addEventListener('pointerdown', (event) => {
      if (held || !event.isPrimary || event.button !== 0) return;
      blockClick = false;
      const button = event.target.closest('button');
      const sample = button?.querySelector('svg');
      if (!sample || (event.pointerType === 'touch' && !sample.contains(event.target))) return;
      const id = event.pointerId;
      const listeners = new AbortController();
      const watch = { signal: listeners.signal };
      held = { id, button, listeners };
      button.focus({ preventScroll: true });
      button.setPointerCapture(id);
      button.addEventListener(
        'pointermove',
        (move) => {
          if (move.pointerId !== id) return;
          if (!held.ghost) {
            if (Math.hypot(move.clientX - event.clientX, move.clientY - event.clientY) < 5) return;
            blockClick = true;
            held.ghost = sample.cloneNode(true);
            held.ghost.classList.add('piece-in-hand');
            document.body.append(held.ghost);
          }
          held.ghost.style.transform = `translate(${move.clientX - 46}px,${move.clientY - 54}px)`;
          const tile = plotAt(move);
          if (held.target !== tile) {
            held.target?.classList.remove('drop-target');
            tile?.classList.add('drop-target');
            held.target = tile;
          }
        },
        watch,
      );
      button.addEventListener(
        'pointerup',
        (up) => {
          if (up.pointerId !== id) return;
          const tile = held.ghost && plotAt(up);
          // Capture redirects even a release just outside the original button.
          if (!button.contains(document.elementFromPoint(up.clientX, up.clientY)))
            blockClick = true;
          finish();
          if (tile) drop(Number(tile.dataset.plot), button.dataset.code);
        },
        watch,
      );
      for (const type of ['lostpointercapture', 'pointercancel']) {
        button.addEventListener(
          type,
          (e) => {
            if (e.pointerId === id) cancel();
          },
          watch,
        );
      }
      window.addEventListener(
        'keydown',
        (e) => {
          if (e.key === 'Escape') cancel();
        },
        watch,
      );
      window.addEventListener('scroll', cancel, { ...watch, capture: true });
      window.addEventListener('wheel', cancel, { ...watch, passive: true });
      window.addEventListener('blur', cancel, watch);
    });
  }
  const editor = byId('quarter-editor');
  if (editor) {
    const scene = byId('quarter-model');
    let saved = readQuarter();
    const state = saved || { tiles: ['p', 'g', 's', 'x'], light: 'day' };
    let active = state.tiles.includes('x') ? state.tiles.indexOf('x') : 0;
    function selectPlot(code) {
      active = Number(code);
      render();
    }
    const select = options(byId('plot-options'), Object.entries(plots), selectPlot);
    const place = options(
      byId('piece-options'),
      Object.entries({ ...pieces, x: 'Освободить' }),
      (code) => {
        state.tiles[active] = code;
        render(active);
        if (saved) updateAddress(state);
      },
    );
    const tray = byId('piece-options');
    for (const button of tray.children) {
      if (button.dataset.code === 'x') continue;
      const sample = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sample.setAttribute('viewBox', '248 49 190 115');
      sample.setAttribute('aria-hidden', 'true');
      drawQuarter(sample, { light: 'day' }, -1, -1, button.dataset.code);
      button.prepend(sample);
    }
    wireTray(tray, scene, (index, code) => {
      active = index;
      state.tiles[index] = code;
      render(index);
      if (saved) updateAddress(state);
    });
    const illuminate = options(byId('light-options'), Object.entries(lights), (code) => {
      state.light = code;
      render();
      if (saved) updateAddress(state);
    });
    scene.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-plot]');
      if (tile) selectPlot(tile.dataset.plot);
    });
    function render(landed = -1) {
      select(String(active));
      place(state.tiles[active]);
      illuminate(state.light);
      byId('piece-legend').textContent =
        'Участок ' +
        plots[active].toLowerCase() +
        ' · ' +
        pieces[state.tiles[active]].toLowerCase();
      const filled = state.tiles.filter((tile) => tile !== 'x').length;
      const stage = byId('quarter-stage');
      if (filled === 0) stage.textContent = 'Выберите первую деталь';
      else if (filled === plots.length) stage.textContent = 'Квартал собран';
      else stage.textContent = `Квартал в сборке · ${filled} из 4`;
      byId('quarter-description').textContent = describe(state);
      editor.dataset.light = state.light;
      drawQuarter(scene, state, active, landed);
      const apply = byId('quarter-apply');
      apply.hidden = filled === 0;
      apply.href = 'price.html?' + query(state) + '#request';
    }
    byId('quarter-reset').addEventListener('click', () => {
      state.tiles.fill('x');
      state.light = 'day';
      active = 0;
      saved = null;
      updateAddress(null, '#quarter-studio');
      render();
    });
    render();
    editor.hidden = false;
    const legacyHash = location.hash;
    if (['#scale-lab', '#drawing'].includes(legacyHash)) {
      window.addEventListener(
        'pageshow',
        (event) => {
          if (
            event.persisted ||
            performance.getEntriesByType('navigation')[0]?.type === 'back_forward'
          )
            return;
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              if (
                location.hash !== legacyHash ||
                history.state?.artmaketQuarterAnchor === legacyHash
              )
                return;
              byId('quarter-studio').scrollIntoView({ block: 'start', behavior: 'instant' });
              replaceAddress(undefined, { ...history.state, artmaketQuarterAnchor: legacyHash });
            }),
          );
        },
        { once: true },
      );
    }
  }
  const form = byId('request-form');
  if (!form) return;
  const panel = byId('quarter-confirmation');
  const receipt = byId('quarter-receipt');
  const size = byId('size');
  const state = readQuarter();
  if (state) {
    byId('object-name').value = 'Мой квартал';
    form.querySelector('[value="Градостроительный"]').checked = true;
    size.required = false;
    byId('wishes').required = false;
    size.placeholder = 'Можно уточнить позже';
    const edit = document.createElement('details');
    const heading = document.createElement('summary');
    heading.textContent = 'Изменить композицию';
    edit.append(heading);
    panel.insertBefore(edit, panel.querySelector('a'));
    const mark = [];
    function update() {
      for (const element of [panel, receipt]) {
        const preview = element.querySelector('.composition-preview');
        drawQuarter(preview, state, -1);
        preview.dataset.light = state.light;
        element.querySelector('[data-description]').textContent = describe(state);
        element.querySelector('[data-return]').href =
          'index.html?' + query(state) + '#quarter-studio';
      }
      mark.forEach((fn) => fn());
    }
    function addChoices(title, choices, current, save) {
      const group = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = title;
      group.append(legend);
      const row = document.createElement('div');
      row.className = 'piece-options';
      group.append(row);
      edit.append(group);
      const activate = options(row, Object.entries(choices), (code) => {
        save(code);
        update();
        updateAddress(state);
      });
      mark.push(() => activate(current()));
    }
    plots.forEach((name, i) =>
      addChoices(
        name,
        pieces,
        () => state.tiles[i],
        (code) => (state.tiles[i] = code),
      ),
    );
    addChoices(
      'Освещение',
      lights,
      () => state.light,
      (code) => (state.light = code),
    );
    panel.hidden = false;
    update();
  } else {
    fillLegacyDimensions();
  }
  function fillLegacyDimensions() {
    const presets = new Map([
      ['pavilion', ['Павильон', 48, 30]],
      ['house', ['Дом', 24, 14]],
      ['district', ['Квартал', 96, 60]],
    ]);
    const preset = presets.get(params.get('object'));
    function dimension(key, index) {
      if (!params.has('length') && !params.has('width')) return preset?.[index];
      const raw = params.get(key) || '';
      return /^\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(',', '.')) : NaN;
    }
    const length = dimension('length', 1),
      width = dimension('width', 2);
    const scale = Number(params.get('scale'));
    if (
      ![length, width].every((n) => n >= 0.1 && n <= 300) ||
      ![50, 100, 200, 500].includes(scale) ||
      (length * 100) / scale > 54 ||
      (width * 100) / scale > 34
    )
      return;
    const fields = ['original-length', 'original-width', 'original-scale'].map(byId);
    const group = byId('legacy-dimensions');
    group.hidden = group.disabled = false;
    byId('object-name').value =
      preset && length === preset[1] && width === preset[2]
        ? preset[0]
        : params.get('object') === 'custom'
          ? 'Свой объект'
          : '';
    function resize() {
      if (!fields.every((field) => field.validity.valid)) return;
      const [l, w, s] = fields.map((field) => field.valueAsNumber);
      const format = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
      size.value = `1:${s}; ${format((l * 100) / s)} × ${format((w * 100) / s)} см`;
    }
    fields.forEach((field, i) => {
      field.value = [length, width, scale][i];
      field.addEventListener('input', resize);
    });
    resize();
  }
  form.addEventListener('demo-checked', () => {
    receipt.hidden = panel.hidden;
  });
  byId('form-repeat').addEventListener('click', () => {
    panel.hidden = receipt.hidden = true;
    panel.replaceChildren();
    receipt.replaceChildren();
    byId('legacy-dimensions').disabled = byId('legacy-dimensions').hidden = true;
    size.required = true;
    byId('wishes').required = true;
    size.placeholder = 'Например: 1:200 или 80 × 60 см';
    updateAddress(null, '#request', true);
  });
})();
