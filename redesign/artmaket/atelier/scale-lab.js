'use strict';
(() => {
  const objects = {
    pavilion: { name: 'Павильон', width: 48, depth: 30 },
    house: { name: 'Дом', width: 24, depth: 14 },
    district: { name: 'Квартал', width: 96, depth: 60 },
  };
  const scales = [50, 100, 200, 500];
  const format = (n) => Number(n.toFixed(2)).toLocaleString('ru-RU');
  const byId = (id) => document.getElementById(id);
  function number(raw) {
    if (!/^\d+(?:[.,]\d+)?$/.test(raw.trim())) return NaN;
    return Number(raw.trim().replace(',', '.'));
  }
  const validDimension = (n) => Number.isFinite(n) && n >= 0.1 && n <= 300;
  function calculate(object, scale) {
    const width = (object.width * 100) / scale,
      depth = (object.depth * 100) / scale;
    const marginX = (60 - width) / 2,
      marginY = (40 - depth) / 2;
    return { width, depth, marginX, marginY, fits: marginX >= 3 && marginY >= 3 };
  }
  function message(container, title, ...paragraphs) {
    const heading = document.createElement('strong');
    heading.textContent = title;
    container.replaceChildren(heading);
    paragraphs.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      container.append(p);
    });
  }
  const lab = byId('scale-lab');
  if (lab) {
    let objectKey = 'pavilion',
      scale = null,
      currentObject = null,
      currentResult = null;
    const plan = byId('scale-plan'),
      apply = byId('scale-apply');
    function label(id, x, y, text, fontSize) {
      const element = byId(id);
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      element.style.fontSize = `${fontSize}px`;
      element.textContent = text;
    }
    function draw(object, result) {
      const w = result ? result.width * 10 : 0,
        h = result ? result.depth * 10 : 0;
      // Reserve separate dimension rails around the union of table and object.
      const extentW = Math.max(600, w),
        extentH = Math.max(400, h);
      const unit = Math.max(1, extentW / 600, extentH / 400);
      const pad = 100 * unit;
      const font = Math.max(19 * unit, (15 * (extentW + pad * 2)) / (plan.clientWidth || 600));
      const left = 360 - extentW / 2,
        top = 260 - extentH / 2;
      plan.setAttribute(
        'viewBox',
        `${left - pad} ${top - pad} ${extentW + pad * 2} ${extentH + pad * 2}`,
      );
      label('table-width', 360, top - pad * 0.65, 'Стол 60 × 40 см', font);
      label('table-depth', 360, top + extentH + pad * 0.9, 'Поле 54 × 34 см', font);
      label(
        'model-width',
        360,
        top + extentH + pad * 0.42,
        result ? `Макет ${format(result.width)} × ${format(result.depth)} см` : 'Выберите масштаб',
        font,
      );
      label('model-depth', 0, 0, '', font);
      byId('plan-object').toggleAttribute('hidden', !result);
      if (!result) {
        delete plan.dataset.fit;
        plan.setAttribute(
          'aria-label',
          'Пустой стенд 60 на 40 см, доступное поле 54 на 34 см. Выберите масштаб.',
        );
        return;
      }
      const x = 360 - w / 2,
        y = 260 - h / 2;
      const path = (points) =>
        points.map(([a, b], i) => `${i ? 'L' : 'M'}${x + a * w} ${y + b * h}`).join(' ') + 'Z';
      const rectangle = (a, b, c, d) =>
        path([
          [a, b],
          [a + c, b],
          [a + c, b + d],
          [a, b + d],
        ]);
      let outline, details;
      if (objectKey === 'pavilion') {
        outline = path([
          [0, 0],
          [1, 0],
          [1, 1],
          [0.68, 1],
          [0.68, 0.45],
          [0.32, 0.45],
          [0.32, 1],
          [0, 1],
        ]);
        details =
          path([
            [0.08, 0.1],
            [0.92, 0.1],
            [0.92, 0.3],
            [0.08, 0.3],
          ]) +
          rectangle(0.1, 0.5, 0.12, 0.4) +
          rectangle(0.78, 0.5, 0.12, 0.4);
      } else if (objectKey === 'house') {
        outline = path([
          [0, 0],
          [0.8, 0],
          [0.8, 0.55],
          [1, 0.55],
          [1, 1],
          [0, 1],
        ]);
        details = `M${x} ${y + h * 0.65}H${x + w}M${x + w * 0.4} ${y}V${y + h * 0.65}`;
      } else if (objectKey === 'district') {
        outline =
          rectangle(0, 0, 0.28, 0.4) +
          rectangle(0.36, 0, 0.28, 0.4) +
          rectangle(0.72, 0, 0.28, 0.4) +
          rectangle(0, 0.65, 0.28, 0.35) +
          rectangle(0.65, 0.65, 0.35, 0.35);
        details = `M${x} ${y + h * 0.52}H${x + w}M${x + w * 0.47} ${y + h * 0.52}V${y + h}`;
      } else {
        outline = rectangle(0, 0, 1, 1);
        details = `M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`;
      }
      byId('building-plan').setAttribute('d', outline);
      byId('building-lines').setAttribute('d', details);
      plan.dataset.fit = String(result.fits);
      plan.setAttribute(
        'aria-label',
        `${object.name}: ${format(result.width)} на ${format(result.depth)} см. Стол 60 на 40 см, полезное поле 54 на 34 см.`,
      );
    }
    function update() {
      currentObject = null;
      currentResult = null;
      lab
        .querySelectorAll('[data-object]')
        .forEach((button) =>
          button.setAttribute('aria-pressed', String(button.dataset.object === objectKey)),
        );
      lab
        .querySelectorAll('[data-scale]')
        .forEach((button) =>
          button.setAttribute('aria-pressed', String(Number(button.dataset.scale) === scale)),
        );
      byId('custom-dimensions').hidden = objectKey !== 'custom';
      let object = objects[objectKey];
      if (objectKey === 'custom') {
        object = {
          name: 'Свой объект',
          width: number(byId('custom-length').value),
          depth: number(byId('custom-width').value),
        };
        const valid = validDimension(object.width) && validDimension(object.depth);
        byId('custom-error').textContent = valid
          ? ''
          : 'Введите длину и ширину от 0,1 до 300 м. Например: 24,5.';
        for (const [id, value] of [
          ['custom-length', object.width],
          ['custom-width', object.depth],
        ])
          byId(id).setAttribute('aria-invalid', String(!validDimension(value)));
        if (!valid) {
          apply.hidden = true;
          apply.removeAttribute('href');
          draw(null, null);
          message(
            byId('scale-result'),
            'Уточните габариты',
            'Расчёт появится после ввода двух размеров в допустимом диапазоне.',
          );
          return;
        }
      }
      if (!scale) {
        apply.hidden = true;
        apply.removeAttribute('href');
        draw(null, null);
        message(
          byId('scale-result'),
          'Выберите масштаб',
          'На стенде 60 × 40 см оставим край 3 см. Сравните размер модели и доступное поле.',
        );
        return;
      }
      const result = calculate(object, scale);
      const best = scales.find((candidate) => calculate(object, candidate).fits);
      currentObject = object;
      currentResult = result;
      draw(object, result);
      let title, advice;
      if (!result.fits) {
        title =
          result.marginX < 0 || result.marginY < 0
            ? 'Макет выходит за стол'
            : 'Недостаточно свободного поля';
        advice = best
          ? `Выберите 1:${best}: это самый крупный подходящий масштаб из предложенных.`
          : 'Даже 1:500 не оставляет нужного поля. Нужен больший подмакетник, более мелкий масштаб или отдельный фрагмент территории.';
      } else if (scale === best) {
        title = 'Подходит: крупно и с запасом';
        advice =
          'Самый крупный подходящий вариант из предложенных. Фасады и благоустройство можно обсудить с мастерской.';
      } else {
        title = 'Помещается, но детали мельче';
        advice = `При 1:${best} модель будет крупнее. Выбранный компактный вариант тоже можно передать в заявку.`;
      }
      const margins =
        result.marginX < 0 || result.marginY < 0
          ? `Выход за край: ${format(Math.max(0, -result.marginX))} см с каждого торца, ${format(Math.max(0, -result.marginY))} см с каждой боковой стороны.`
          : `Свободный край: ${format(result.marginX)} см с каждого торца, ${format(result.marginY)} см с каждой боковой стороны. Минимальное поле — ${format(Math.min(result.marginX, result.marginY))} см.`;
      const detail = {
        50: '1:50 — интерьеры и крупные детали фасада.',
        100: '1:100 — отдельное здание и фасады.',
        200: '1:200 — ансамбль и благоустройство.',
        500: '1:500 — территория и взаимное положение зданий.',
      }[scale];
      message(
        byId('scale-result'),
        title,
        `Размер макета: ${format(result.width)} × ${format(result.depth)} см. ${margins}`,
        advice,
        `${detail} Реальную детализацию согласуем по чертежам.`,
      );
      if (result.fits) {
        const query = new URLSearchParams({
          object: objectKey,
          length: String(object.width),
          width: String(object.depth),
          scale: String(scale),
        });
        apply.href = `price.html?${query}#request`;
        apply.hidden = false;
      } else {
        apply.hidden = true;
        apply.removeAttribute('href');
      }
    }
    lab.querySelectorAll('[data-object]').forEach((button) =>
      button.addEventListener('click', () => {
        objectKey = button.dataset.object;
        update();
      }),
    );
    lab.querySelectorAll('[data-scale]').forEach((button) =>
      button.addEventListener('click', () => {
        scale = Number(button.dataset.scale);
        update();
      }),
    );
    for (const id of ['custom-length', 'custom-width']) byId(id).addEventListener('input', update);
    byId('scale-reset').addEventListener('click', () => {
      objectKey = 'pavilion';
      scale = null;
      byId('custom-length').value = '48';
      byId('custom-width').value = '30';
      update();
    });
    if (typeof ResizeObserver !== 'undefined')
      new ResizeObserver(() => draw(currentObject, currentResult)).observe(plan);
    update();
  }
  const confirmation = byId('scale-confirmation');
  if (confirmation) {
    const params = new URLSearchParams(location.search);
    const key = params.get('object');
    const preset = Object.hasOwn(objects, key) ? objects[key] : null;
    const hasDimensions = params.has('length') || params.has('width');
    const width = hasDimensions ? number(params.get('length') || '') : preset?.width;
    const depth = hasDimensions ? number(params.get('width') || '') : preset?.depth;
    const scale = number(params.get('scale') || '');
    if (!validDimension(width) || !validDimension(depth) || !scales.includes(scale)) return;
    const result = calculate({ width, depth }, scale);
    if (!result.fits) return;
    // A preset name applies only to its actual dimensions; unknown enums are ignored.
    const name =
      preset && preset.width === width && preset.depth === depth
        ? preset.name
        : key === 'custom'
          ? 'Свой объект'
          : '';
    const objectField = byId('object-name'),
      sizeField = byId('size');
    objectField.value = name;
    sizeField.value = `1:${scale}; ${format(result.width)} × ${format(result.depth)} см`;
    function confirm(edited = false) {
      confirmation.hidden = false;
      message(
        confirmation,
        edited ? 'Актуальные параметры' : 'Из подбора масштаба',
        `Объект: ${objectField.value.trim() || 'не указан'}. Размер и масштаб: ${sizeField.value.trim() || 'не указаны'}.`,
        ...(edited
          ? []
          : [`Исходные габариты: ${format(width)} × ${format(depth)} м. Подмакетник 60 × 40 см.`]),
      );
      const link = document.createElement('a');
      link.href = 'index.html#scale-lab';
      link.className = 'text-link';
      link.textContent = 'Подобрать заново';
      confirmation.append(link);
    }
    confirm();
    for (const field of [objectField, sizeField])
      field.addEventListener('input', () => confirm(true));
  }
})();
