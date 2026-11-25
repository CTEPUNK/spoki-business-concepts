'use strict';
document.body.classList.add('js');
const menu = document.querySelector('.menu-toggle'),
  nav = document.querySelector('header nav');
const mobileMenu = matchMedia('(max-width:920px)');
function syncMenu() {
  menu.hidden = !mobileMenu.matches;
  if (!mobileMenu.matches) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    if (document.activeElement === menu) nav.querySelector('a').focus();
  }
}
mobileMenu.addEventListener('change', syncMenu);
syncMenu();
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
  fine = matchMedia('(hover:hover) and (pointer:fine)');
const sections = [...document.querySelectorAll('.reactive')];
let frame = 0;
const hero = document.querySelector('.hero');
function scrollArt() {
  frame = 0;
  for (const el of sections) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      let progress = 0.5;
      if (el === hero) {
        const turnDistance = Math.min(r.height * 0.48, innerHeight * 0.31);
        const turn = Math.min(1, Math.max(0, window.scrollY / turnDistance));
        progress = reduced.matches ? 0 : turn * (2 - turn);
      } else if (!reduced.matches) {
        progress = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
      }
      el.style.setProperty('--progress', progress.toFixed(4));
      el.style.setProperty('--spread', `${8 + progress * 34}px`);
    }
  }
}
addEventListener(
  'scroll',
  () => {
    if (!frame) frame = requestAnimationFrame(scrollArt);
  },
  { passive: true },
);
addEventListener('resize', scrollArt);
reduced.addEventListener('change', scrollArt);
scrollArt();
if (hero) {
  let pointerFrame = 0;
  let horizontal = 0;
  let vertical = 0;
  function drawPointerPose() {
    hero.style.setProperty('--pointer-u', horizontal.toFixed(3));
    hero.style.setProperty('--pointer-v', vertical.toFixed(3));
    pointerFrame = 0;
  }
  function centerBook() {
    cancelAnimationFrame(pointerFrame);
    horizontal = 0;
    vertical = 0;
    drawPointerPose();
  }
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced.matches || !fine.matches) return;
    const bounds = hero.getBoundingClientRect();
    horizontal = 2 * (event.clientX - bounds.left) / bounds.width - 1;
    vertical = 2 * (event.clientY - bounds.top) / bounds.height - 1;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointerPose);
  });
  hero.addEventListener('pointerleave', centerBook);
  fine.addEventListener('change', centerBook);
  reduced.addEventListener('change', centerBook);
}
const contact = document.querySelector('.contact-button');
contact.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
});
contact.addEventListener('pointermove', (e) => {
  if (reduced.matches || !fine.matches) return;
  const r = contact.getBoundingClientRect();
  contact.firstElementChild.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.07}px,${(e.clientY - r.top - r.height / 2) * 0.12}px)`;
});
contact.addEventListener('pointerleave', () => (contact.firstElementChild.style.transform = ''));
const sliders = [...document.querySelectorAll('.proof-controls input')],
  proof = document.querySelector('.proof-paper'),
  print = document.querySelector('#print-proof'),
  status = document.querySelector('#proof-status');
if (proof) {
  const update = () => {
    let aligned = true;
    sliders.forEach((s, i) => {
      const v = Number(s.value);
      document.querySelector(`.color-layer.${s.id}`).style.transform =
        `translate${i === 1 ? 'Y' : 'X'}(${v}px)`;
      if (Math.abs(v) > 2) aligned = false;
    });
    proof.classList.remove('complete');
    print.disabled = !aligned;
    status.textContent = aligned
      ? 'Слои совмещены. Добавьте чёрный для финального отпечатка.'
      : 'Сведите слои к центральным отметкам.';
  };
  sliders.forEach((s) => s.addEventListener('input', update));
  print.addEventListener('click', () => {
    if (print.disabled) return;
    proof.classList.add('complete');
    status.textContent = 'Отпечаток готов: цвета совмещены, чёрный добавил контраст.';
    print.disabled = true;
  });
  document.querySelector('#proof-reset').addEventListener('click', () => {
    sliders.forEach((s, i) => (s.value = [-24, 22, -16][i]));
    update();
  });
  update();
}
const form = document.querySelector('#quote-form');
if (form) {
  const calculate = document.querySelector('#calculate'),
    result = document.querySelector('#quote-result');
  calculate.disabled = false;
  const types = {
      buklety: 'Буклеты',
      broshyury: 'Брошюры',
      katalogi: 'Каталоги',
      kalendari: 'Календари',
      knigi: 'Книги',
    },
    selected = types[new URLSearchParams(location.search).get('product')];
  if (typeof selected === 'string')
    form.querySelectorAll('[name=product]').forEach((i) => (i.checked = i.value === selected));
  const demo = document.querySelector('#demo-form');
  const done = document.querySelector('#demo-done');
  const summary = document.querySelector('#specification');
  const draft = document.querySelector('#request-text');
  const email = document.querySelector('#email');
  const checked = document.querySelector('#checked-request');
  let transferred = null;
  const customSize = document.querySelector('#custom-size');
  const dimensions = document.querySelector('#dimensions');
  const copyStatus = document.querySelector('#copy-status');
  const manualCopy = document.querySelector('#manual-copy');
  let copyRequest = 0;

  function parseDimensions(value) {
    const match = /^(\d+(?:[.,]\d+)?)\s*[×xх]\s*(\d+(?:[.,]\d+)?)$/iu.exec(value.trim());
    if (!match) return null;
    const sides = match.slice(1);
    if (!sides.every(side => /[1-9]/.test(side))) return null;
    return sides.map(side => side.replace('.', ',')).join(' × ') + ' мм';
  }

  dimensions.addEventListener('input', () => dimensions.setCustomValidity(''));
  function syncFormat() {
    const custom = form.querySelector('[name=format]:checked').value === 'Другой — уточнить';
    customSize.hidden = !custom;
    dimensions.disabled = !custom;
    dimensions.required = custom;
    if (!custom) dimensions.setCustomValidity('');
  }
  form.addEventListener('change', syncFormat);
  syncFormat();

  function show(panel, focusTarget) {
    copyRequest++;
    copyStatus.textContent = '';
    manualCopy.hidden = true;
    manualCopy.querySelector('textarea').value = '';
    for (const view of [form, result, demo, done]) view.hidden = view !== panel;
    document.querySelector('#params-heading').hidden = panel !== form;
    focusTarget.focus();
  }
  function editParameters() {
    show(form, form.querySelector('[name=product]:checked'));
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const product = form.querySelector('[name=product]:checked').value;
    const format = customSize.hidden ? form.querySelector('[name=format]:checked').value : parseDimensions(dimensions.value);
    if (!format) {
      dimensions.setCustomValidity('Введите ширину и высоту больше нуля в миллиметрах, например 148,5 × 210.');
      dimensions.reportValidity();
      return;
    }
    const quantity = document.querySelector('#quantity').value;
    const details = document.querySelector('#details').value.trim();
    summary.textContent = [product, format, quantity + ' экз.'].join(' · ') + (details ? '\n' + details : '');
    show(result, result);
  });
  document.querySelector('#copy-spec').addEventListener('click', async () => {
    const request = ++copyRequest;
    const specification = summary.textContent;
    try {
      await navigator.clipboard.writeText(specification);
      if (request !== copyRequest) return;
      manualCopy.hidden = true;
      copyStatus.textContent = 'Спецификация скопирована.';
    } catch {
      if (request !== copyRequest) return;
      const field = manualCopy.querySelector('textarea');
      field.value = specification;
      manualCopy.hidden = false;
      copyStatus.textContent = 'Автоматическое копирование недоступно. Скопируйте выделенный текст.';
      field.focus();
      field.select();
    }
  });
  document.querySelector('#transfer').addEventListener('click', () => {
    if (transferred !== summary.textContent) draft.value = summary.textContent;
    transferred = summary.textContent;
    draft.setCustomValidity('');
    show(demo, draft);
  });
  for (const id of ['edit-spec', 'back-spec']) {
    document.getElementById(id).addEventListener('click', editParameters);
  }
  draft.addEventListener('input', () => draft.setCustomValidity(''));
  demo.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!draft.value.trim()) {
      draft.setCustomValidity('Укажите параметры тиража.');
      draft.reportValidity();
      return;
    }
    checked.textContent = draft.value.trim() + '\nКонтакт: ' + email.value;
    show(done, done);
  });
  document.querySelector('#revise').addEventListener('click', () => show(demo, draft));
  document.querySelector('#quote-reset').addEventListener('click', () => {
    form.reset();
    demo.reset();
    syncFormat();
    transferred = null;
    checked.textContent = '';
    summary.textContent = '';
    editParameters();
  });
}
