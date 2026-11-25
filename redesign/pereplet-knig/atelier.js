'use strict';

(() => {
  const printLinks = [...document.querySelectorAll('[data-view-photo]')];
  const reader = document.getElementById('photo-reader');
  if (reader && typeof reader.showModal === 'function' && printLinks.length) {
    const photo = document.createElement('img');
    photo.id = 'reader-image';
    const title = document.getElementById('reader-title');
    const caption = document.getElementById('reader-caption');
    const count = document.getElementById('reader-count');
    const stage = reader.querySelector('.reader-stage');
    let index = 0;
    let opener = null;
    let gesture = null;

    function showPicture(next) {
      index = (next + printLinks.length) % printLinks.length;
      const link = printLinks[index];
      photo.alt = link.dataset.caption;
      photo.src = link.href;
      if (!photo.isConnected) stage.append(photo);
      title.textContent = link.dataset.title;
      caption.textContent = link.dataset.caption;
      count.textContent = (index + 1) + ' / ' + printLinks.length;
    }

    for (const [position, link] of printLinks.entries()) {
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        showPicture(position);
        reader.showModal();
        document.getElementById('reader-close').focus({preventScroll:true});
      });
    }
    document.getElementById('reader-close').addEventListener('click', () => reader.close());
    document.getElementById('reader-prev').addEventListener('click', () => showPicture(index - 1));
    document.getElementById('reader-next').addEventListener('click', () => showPicture(index + 1));
    reader.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        showPicture(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    reader.addEventListener('click', event => {
      if (event.target !== reader) return;
      const r = reader.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) reader.close();
    });
    stage.addEventListener('touchstart', event => {
      gesture = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
    }, {passive:true});
    stage.addEventListener('touchcancel', () => { gesture = null; });
    stage.addEventListener('touchend', event => {
      if (!gesture) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
      gesture = null;
      if (!event.touches.length && Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        showPicture(index + (dx < 0 ? 1 : -1));
      }
    }, {passive:true});
    reader.addEventListener('close', () => {
      gesture = null;
      if (opener) opener.focus({preventScroll:true});
      opener = null;
    });
  }

  // A selected photograph and the page behind it keep their own focus and scroll.
  const pointerMedia = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const surfaces = [
    '.binding-copy', '.sewing-note', '.hand-copy', '.process-grid > div', '.process-steps > article',
    '.case-copy', '.repair-estimate > div', '.file-copy', '.file-detail', '.compact-call', '.album-heading',
    '.catalog-item', '.catalog-heading', '.catalog-foot', '.rate-grid > div', '.guide-grid > div',
    '.inner-section-art', '.spec-panel', '.proof', '.contact-card', '.contact-copy', '.result-paper'
  ];
  const textPanels = ['.hero-copy','.page-heading > div:first-child','.order-title','.section-head','.restore-heading','.finish-heading'];
  for (const surface of document.querySelectorAll(surfaces.join(','))) surface.classList.add('pointer-zone','pointer-surface');
  for (const panel of document.querySelectorAll([...textPanels,'.work-print'].join(','))) panel.classList.add('pointer-zone');
  for (const heading of document.querySelectorAll('.pointer-zone :is(h1,h2,h3)')) heading.classList.add('ink-title');

  let pointer = null;
  let scheduled = 0;
  let previous = [];
  const properties = ['--px','--py','--print-x','--print-y','--edge-x','--edge-y'];

  function clearZone(zone) {
    zone.removeAttribute('data-pointing');
    for (const property of properties) zone.style.removeProperty(property);
  }
  function clearPointer() {
    pointer = null;
    cancelAnimationFrame(scheduled);
    scheduled = 0;
    previous.forEach(clearZone);
    previous = [];
  }
  function renderPointer() {
    scheduled = 0;
    if (!pointer || !pointerMedia.matches) return;
    const hit = document.elementFromPoint(pointer.x, pointer.y);
    let zone = hit && hit.closest('.pointer-zone');
    const areas = [];
    while (zone) {
      areas.push({element:zone, bounds:zone.getBoundingClientRect()});
      zone = zone.parentElement && zone.parentElement.closest('.pointer-zone');
    }
    previous.filter(old => !areas.some(area => area.element === old)).forEach(clearZone);
    for (const {element, bounds} of areas) {
      const x = Math.max(0, Math.min(1, (pointer.x - bounds.left) / (bounds.width || 1)));
      const y = Math.max(0, Math.min(1, (pointer.y - bounds.top) / (bounds.height || 1)));
      element.dataset.pointing = '';
      element.style.setProperty('--px', (100 * x).toFixed(1) + '%');
      element.style.setProperty('--py', (100 * y).toFixed(1) + '%');
      element.style.setProperty('--print-x', ((x - .5) * 13).toFixed(2) + 'px');
      element.style.setProperty('--print-y', ((y - .5) * 9).toFixed(2) + 'px');
      element.style.setProperty('--edge-x', ((.5 - x) * 7).toFixed(2) + 'px');
      element.style.setProperty('--edge-y', ((.5 - y) * 5).toFixed(2) + 'px');
    }
    previous = areas.map(area => area.element);
  }
  function schedule() {
    if (pointer && !scheduled) scheduled = requestAnimationFrame(renderPointer);
  }
  document.addEventListener('pointermove', event => {
    if (!pointerMedia.matches || event.pointerType === 'touch') {
      if (pointer) clearPointer();
      return;
    }
    pointer = {x:event.clientX, y:event.clientY};
    schedule();
  }, {passive:true});
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) clearPointer(); });
  document.addEventListener('pointercancel', clearPointer);
  pointerMedia.addEventListener('change', clearPointer);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('blur', clearPointer);
  if (reader) reader.addEventListener('close', clearPointer);
})();
