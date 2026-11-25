'use strict';

(() => {
  const root = document.querySelector('.window-chapter');
  if (!root) return;

  const viewChoices = root.querySelector('.detail-choices');
  const leadImage = root.querySelector('.photo-surface img');
  const note = root.querySelector('#window-note');
  viewChoices.hidden = false;
  viewChoices.addEventListener('click', event => {
    const choice = event.target.closest('button[data-view]');
    if (!choice || choice.getAttribute('aria-pressed') === 'true') return;
    const slug = choice.dataset.view;
    const path = 'assets/glass/' + slug + '-';
    leadImage.srcset = [552, 900, 1400].map(width => path + width + '.webp ' + width + 'w').join(', ');
    leadImage.src = path + '552.webp';
    leadImage.alt = choice.dataset.detailAlt;
    note.textContent = choice.dataset.note;
    for (const item of viewChoices.querySelectorAll('button')) {
      item.setAttribute('aria-pressed', String(item === choice));
    }
  });

  const anchors = Array.from(document.querySelectorAll('[data-photo]'));
  const viewer = document.querySelector('#photo-viewer');
  if (typeof viewer.showModal === 'function') {
    const stage = viewer.querySelector('.viewer-image');
    const title = viewer.querySelector('#viewer-title');
    const credit = viewer.querySelector('#viewer-credit');
    const source = viewer.querySelector('#viewer-source');
    const count = viewer.querySelector('#viewer-count');
    const close = viewer.querySelector('[data-close]');
    let index = 0;
    let opener = null;

    function selectPhoto(next) {
      index = (next + anchors.length) % anchors.length;
      const anchor = anchors[index];
      const full = new Image();
      full.alt = anchor.dataset.fullAlt;
      full.src = anchor.href;
      stage.replaceChildren(full);
      title.textContent = anchor.dataset.photoName;
      credit.textContent = anchor.dataset.credit;
      source.href = anchor.dataset.source;
      count.textContent = (index + 1) + ' из ' + anchors.length;
    }

    anchors.forEach((anchor, n) => {
      anchor.setAttribute('aria-haspopup', 'dialog');
      anchor.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        opener = anchor;
        selectPhoto(n);
        viewer.showModal();
        close.focus({preventScroll: true});
      });
    });
    viewer.querySelectorAll('[data-change]').forEach(button => {
      button.addEventListener('click', () => selectPhoto(index + Number(button.dataset.change)));
    });
    close.addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      selectPhoto(index + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    viewer.addEventListener('close', () => {
      stage.replaceChildren();
      opener?.focus({preventScroll: true});
      opener = null;
    });
  }

  for (const element of document.querySelectorAll('.section-title, .quick-inner > a, .footer-inner')) {
    if (!element.closest('[data-responsive]')) element.setAttribute('data-responsive', '');
  }
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const visible = new Set();
  const photos = anchors.map(anchor => anchor.closest('figure'));
  const vars = ['--spot-x', '--spot-y', '--shift-x', '--shift-y', '--lean-x', '--lean-y', '--tint', '--lit'];
  let previous = null;
  let lastPointer = null;
  let frame = 0;
  let updateScroll = false;

  function clearPointer() {
    if (previous) vars.forEach(key => previous.style.removeProperty(key));
    previous = null;
  }
  function paintPointer() {
    if (!lastPointer || !fine.matches || !motion.matches || viewer.open) { clearPointer(); return; }
    const {x, y} = lastPointer;
    const region = document.elementFromPoint(x, y)?.closest('[data-responsive]');
    if (previous !== region) clearPointer();
    if (!region) return;
    previous = region;
    const rect = region.getBoundingClientRect();
    const wx = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    const wy = Math.min(1, Math.max(0, (y - rect.top) / rect.height));
    const dx = wx * 2 - 1;
    const dy = wy * 2 - 1;
    region.style.setProperty('--spot-x', (wx * 100).toFixed(1) + '%');
    region.style.setProperty('--spot-y', (wy * 100).toFixed(1) + '%');
    region.style.setProperty('--shift-x', (dx * 7).toFixed(2) + 'px');
    region.style.setProperty('--shift-y', (dy * 5).toFixed(2) + 'px');
    region.style.setProperty('--lean-x', (-dy * 4).toFixed(2) + 'deg');
    region.style.setProperty('--lean-y', (dx * 5).toFixed(2) + 'deg');
    region.style.setProperty('--tint', (18 + wx * 57 + (1 - wy) * 19).toFixed(1) + '%');
    region.style.setProperty('--lit', '1');
  }
  function render() {
    frame = 0;
    if (updateScroll && motion.matches) {
      const height = window.innerHeight;
      for (const figure of visible) {
        const rect = figure.getBoundingClientRect();
        const entry = Math.max(0, Math.min(1, (height - rect.top) / (height * .8)));
        figure.style.setProperty('--entry-y', ((1 - entry) * 4).toFixed(2) + 'px');
        figure.style.setProperty('--entry-scale', (1.06 + (1 - entry) * .045).toFixed(4));
      }
    }
    updateScroll = false;
    paintPointer();
  }
  function schedule(scroll = false) {
    updateScroll ||= scroll;
    if (!frame) frame = requestAnimationFrame(render);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    if (motion.matches) schedule(true);
  }, {rootMargin: '6% 0px'});
  photos.forEach(figure => observer.observe(figure));
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons || !fine.matches || !motion.matches) return;
    lastPointer = {x: event.clientX, y: event.clientY};
    schedule();
  }, {passive: true});
  function leave() { lastPointer = null; clearPointer(); }
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) leave(); }, {passive: true});
  window.addEventListener('blur', leave);
  document.addEventListener('keydown', event => { if (event.key === 'Tab') leave(); });
  function syncScroll() { if (motion.matches) schedule(true); }
  window.addEventListener('scroll', syncScroll, {passive: true});
  window.addEventListener('resize', syncScroll, {passive: true});
  motion.addEventListener('change', () => {
    leave();
    photos.forEach(figure => {
      figure.style.removeProperty('--entry-y');
      figure.style.removeProperty('--entry-scale');
    });
    syncScroll();
  });
  fine.addEventListener('change', leave);
})();
