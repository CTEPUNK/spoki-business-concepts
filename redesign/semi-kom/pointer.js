(() => {
  'use strict';

  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const inkTargets = [
    'main h1:not(.hero-title)', '.hero-word', 'main h2', 'main h3', '.hero-desc',
    '.intro', '.conditions p', '.cord-strip p', '.price-note p', '.request-intro > p:not(.kicker)', '.total'
  ].join(',');

  const lens = document.createElement('span');
  lens.className = 'photo-lens';
  lens.setAttribute('aria-hidden', 'true');

  let point = null;
  let scheduled = 0;
  let currentFrame = null;
  let currentInk = null;
  let currentPhoto = null;

  function releaseFrame() {
    if (!currentFrame) return;
    currentFrame.removeAttribute('data-frame-active');
    currentFrame.style.removeProperty('--probe-dx');
    currentFrame.style.removeProperty('--probe-dy');
    currentFrame = null;
  }

  function releaseInk() {
    if (!currentInk) return;
    currentInk.removeAttribute('data-ink-active');
    for (const prop of ['--resting-ink', '--ink-x', '--ink-y']) currentInk.style.removeProperty(prop);
    currentInk = null;
  }

  function releasePhoto() {
    if (!currentPhoto) return;
    lens.remove();
    currentPhoto = null;
  }

  function reset() {
    point = null;
    cancelAnimationFrame(scheduled);
    scheduled = 0;
    releaseFrame();
    releaseInk();
    releasePhoto();
  }

  function lightFrame(frame, rect) {
    if (frame !== currentFrame) {
      releaseFrame();
      if (!frame) return;
      currentFrame = frame;
      frame.setAttribute('data-frame-active', '');
    }
    if (!frame) return;
    const dx = (point.x - rect.left) / rect.width * 2 - 1;
    const dy = (point.y - rect.top) / rect.height * 2 - 1;
    frame.style.setProperty('--probe-dx', dx.toFixed(4));
    frame.style.setProperty('--probe-dy', dy.toFixed(4));
  }

  function lightType(ink, rect) {
    if (ink !== currentInk) {
      releaseInk();
      if (!ink) return;
      currentInk = ink;
      ink.style.setProperty('--resting-ink', getComputedStyle(ink).color);
      ink.setAttribute('data-ink-active', '');
    }
    if (!ink) return;
    ink.style.setProperty('--ink-x', (point.x - rect.left).toFixed(1) + 'px');
    ink.style.setProperty('--ink-y', (point.y - rect.top).toFixed(1) + 'px');
  }

  // The lens samples the painted bitmap, accounting for the crop and the scroll transform.
  function inspectPhoto(link) {
    if (link !== currentPhoto) {
      releasePhoto();
      if (!link) return;
      const picture = link.querySelector('img');
      if (!picture?.naturalWidth) return;
      currentPhoto = link;
      lens.style.backgroundImage = 'url("' + picture.currentSrc + '")';
      link.append(lens);
    }
    if (!link || !currentPhoto) return;
    const picture = link.querySelector('img');
    const frame = link.getBoundingClientRect();
    const rect = picture.getBoundingClientRect();
    const style = getComputedStyle(picture);
    let w = rect.width;
    let h = rect.height;
    if (style.objectFit === 'cover' || style.objectFit === 'contain') {
      const ratioX = w / picture.naturalWidth;
      const ratioY = h / picture.naturalHeight;
      const scale = style.objectFit === 'cover' ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
      w = picture.naturalWidth * scale;
      h = picture.naturalHeight * scale;
    }
    const [alignX, alignY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
    const xInPhoto = point.x - rect.left - (rect.width - w) * alignX;
    const yInPhoto = point.y - rect.top - (rect.height - h) * alignY;
    const shortSide = Math.min(frame.width, frame.height);
    const size = Math.min(shortSide, Math.max(50, Math.min(148, shortSide * .57)));
    const radius = size / 2;
    const zoom = Math.min(2.25, Math.max(1, picture.naturalWidth / w));
    lens.style.width = lens.style.height = size.toFixed(2) + 'px';
    lens.style.transform = 'translate(' + (point.x - frame.left - radius).toFixed(2) + 'px, ' + (point.y - frame.top - radius).toFixed(2) + 'px)';
    lens.style.backgroundSize = (w * zoom).toFixed(2) + 'px ' + (h * zoom).toFixed(2) + 'px';
    lens.style.backgroundPosition = (radius - xInPhoto * zoom).toFixed(2) + 'px ' + (radius - yInPhoto * zoom).toFixed(2) + 'px';
  }

  function paint() {
    scheduled = 0;
    if (!point) return;
    const target = document.elementFromPoint(point.x, point.y);
    const frame = target?.closest('[data-pointer-frame]') || null;
    const ink = window.getSelection()?.isCollapsed ? target?.closest(inkTargets) || null : null;
    const photo = target?.closest('.photo-link') || null;
    const frameRect = frame?.getBoundingClientRect();
    const inkRect = ink?.getBoundingClientRect();
    lightFrame(frame, frameRect);
    lightType(ink, inkRect);
    inspectPhoto(photo);
  }

  function queue() {
    if (point && !scheduled) scheduled = requestAnimationFrame(paint);
  }

  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch' || event.buttons) return;
    point = { x: event.clientX, y: event.clientY };
    queue();
  }, { passive: true });
  document.addEventListener('pointerdown', reset, { passive: true });
  document.addEventListener('pointercancel', reset, { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) reset(); }, { passive: true });
  document.addEventListener('keydown', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  finePointer.addEventListener('change', reset);
  reducedMotion.addEventListener('change', reset);
})();
