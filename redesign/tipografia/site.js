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
function scrollArt() {
  frame = 0;
  for (const el of sections) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      const progress = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight * 0.8)));
      el.style.setProperty('--spread', reduced.matches ? '10px' : `${(1 - progress) * 65 + 8}px`);
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
reduced.addEventListener('change', () => {
  sections.forEach((el) => {
    el.style.setProperty('--x', '0px');
    el.style.setProperty('--y', '0px');
  });
  scrollArt();
});
scrollArt();
sections.forEach((el) => {
  let rect,
    raf = 0,
    px = 0,
    py = 0;
  el.addEventListener('pointerenter', () => {
    rect = el.getBoundingClientRect();
  });
  el.addEventListener('pointermove', (e) => {
    if (reduced.matches || !fine.matches) return;
    rect = el.getBoundingClientRect();
    px = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    py = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    if (!raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--x', `${px}px`);
        el.style.setProperty('--y', `${py}px`);
        raf = 0;
      });
  });
  el.addEventListener('pointerleave', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.style.setProperty('--x', '0px');
    el.style.setProperty('--y', '0px');
  });
});
const contact = document.querySelector('.contact-button');
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
  if (selected)
    form.querySelectorAll('[name=product]').forEach((i) => (i.checked = i.value === selected));
  form.addEventListener('submit', (e) => e.preventDefault());
  const assemble = () => {
    if (!form.reportValidity()) return;
    const product = form.querySelector('[name=product]:checked').value,
      format = form.querySelector('[name=format]:checked').value;
    document.querySelector('#specification').textContent =
      `${product} · ${format} · ${document.querySelector('#quantity').value} экз. Контакт: ${document.querySelector('#email').value}.`;
    form.hidden = true;
    result.hidden = false;
    result.focus();
  };
  calculate.addEventListener('click', assemble);
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input:not([type=radio])')) {
      e.preventDefault();
      assemble();
    }
  });
  document.querySelector('#quote-reset').addEventListener('click', () => {
    form.reset();
    result.hidden = true;
    form.hidden = false;
    document.querySelector('#specification').textContent = '';
    form.querySelector('input').focus();
  });
}
