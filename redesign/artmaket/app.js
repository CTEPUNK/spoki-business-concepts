'use strict';
document.documentElement.classList.add('js');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
function closeMenu() {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header')) closeMenu();
});
const magnetic = document.querySelector('.contact-button');
magnetic.addEventListener('pointermove', (e) => {
  if (reduced.matches || e.pointerType !== 'mouse') return;
  const r = magnetic.getBoundingClientRect();
  magnetic.firstElementChild.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.07}px,${(e.clientY - r.top - r.height / 2) * 0.1}px)`;
});
magnetic.addEventListener('pointerleave', () => (magnetic.firstElementChild.style.transform = ''));
const sections = [...document.querySelectorAll('.reactive')];
for (const section of sections) {
  let frame = 0;
  section.addEventListener('pointermove', (e) => {
    if (reduced.matches || e.pointerType !== 'mouse' || frame) return;
    frame = requestAnimationFrame(() => {
      const r = section.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      section.style.setProperty('--x', `${x}px`);
      section.style.setProperty('--y', `${y}px`);
      section.style.setProperty('--dx', `${(x / r.width - 0.5) * 8}px`);
      section.style.setProperty('--dy', `${(y / r.height - 0.5) * 5}px`);
      frame = 0;
    });
  });
  section.addEventListener('pointerleave', () => {
    section.style.setProperty('--dx', '0px');
    section.style.setProperty('--dy', '0px');
  });
}
let scrollFrame = 0;
function scrollArt() {
  scrollFrame = 0;
  for (const section of sections) {
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const progress = Math.min(
      1,
      Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.2)),
    );
    section.style.setProperty('--progress', reduced.matches ? '1' : String(progress));
    section.style.setProperty('--travel', reduced.matches ? '0px' : `${(1 - progress) * 32}px`);
  }
}
addEventListener(
  'scroll',
  () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(scrollArt);
  },
  { passive: true },
);
addEventListener('resize', scrollArt);
reduced.addEventListener('change', () => {
  scrollArt();
  magnetic.firstElementChild.style.transform = '';
});
scrollArt();
// One native modal, with focus restoration and Escape provided by dialog.
const photoDialog = document.querySelector('#photo-dialog');
let opener;
for (const a of document.querySelectorAll('.photo-link'))
  a.addEventListener('click', (e) => {
    e.preventDefault();
    opener = a;
    const image = document.querySelector('#photo-full');
    image.src = a.getAttribute('href');
    image.alt = a.dataset.caption;
    document.querySelector('#photo-caption').textContent = a.dataset.caption;
    photoDialog.showModal();
  });
document.querySelector('.close-photo').addEventListener('click', () => photoDialog.close());
photoDialog.addEventListener('click', (e) => {
  if (e.target === photoDialog) {
    const r = photoDialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      photoDialog.close();
  }
});
photoDialog.addEventListener('close', () => opener?.focus());
for (const input of document.querySelectorAll('[name="filter"]'))
  input.addEventListener('change', () => {
    let n = 0;
    for (const project of document.querySelectorAll('.portfolio-grid .project')) {
      const visible = input.value === 'all' || project.dataset.category === input.value;
      project.hidden = !visible;
      if (visible) n++;
    }
    document.querySelector('#filter-result').textContent = `Показано работ: ${n}`;
  });
const stage = document.querySelector('.model-stage');
if (stage) {
  const choices = [...document.querySelectorAll('.layer-choice input')],
    result = document.querySelector('#model-result'),
    light = document.querySelector('#light-direction');
  function changeLayer(input) {
    stage
      .querySelector(`[data-layer="${input.value}"]`)
      .classList.toggle('layer-hidden', !input.checked);
  }
  function updateResult() {
    const visible = choices.filter((x) => x.checked).length;
    result.textContent =
      visible === 4
        ? stage.classList.contains('exploded')
          ? 'Макет развёрнут по слоям. Все детали на виду.'
          : 'Макет собран: участок, корпус, кровля и свет на своих местах.'
        : `Видно слоёв: ${visible} из 4. Верните детали или соберите макет целиком.`;
  }
  choices.forEach((input) =>
    input.addEventListener('change', () => {
      changeLayer(input);
      updateResult();
    }),
  );
  document.querySelector('#assemble').addEventListener('click', () => {
    choices.forEach((x) => {
      x.checked = true;
      changeLayer(x);
    });
    stage.classList.remove('exploded');
    updateResult();
  });
  document.querySelector('#restart-model').addEventListener('click', () => {
    choices.forEach((x) => {
      x.checked = true;
      changeLayer(x);
    });
    stage.classList.add('exploded');
    light.value = '0';
    setLight(0);
    stage.style.setProperty('--dx', '0px');
    stage.style.setProperty('--dy', '0px');
    updateResult();
  });
  function setLight(value) {
    stage.querySelector('#scene-light').setAttribute('cx', 400 + value * 1.9);
  }
  light.addEventListener('input', () => setLight(Number(light.value)));
  let frame = 0;
  stage.addEventListener('pointermove', (e) => {
    if (reduced.matches || frame) return;
    frame = requestAnimationFrame(() => {
      const r = stage.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      const value = Math.max(-100, Math.min(100, Math.round(x * 200)));
      light.value = String(value);
      setLight(value);
      stage.style.setProperty('--dx', `${x * 8}px`);
      stage.style.setProperty('--dy', `${y * 5}px`);
      frame = 0;
    });
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--dx', '0px');
    stage.style.setProperty('--dy', '0px');
  });
}
const form = document.querySelector('#request-form');
if (form) {
  const submit = document.querySelector('#demo-submit'),
    contact = document.querySelector('#contact'),
    success = document.querySelector('#form-success');
  submit.disabled = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validateDemo();
  });
  contact.addEventListener('input', () => contact.setCustomValidity(''));
  function validateDemo() {
    const value = contact.value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      isPhone =
        /^\+?[\d\s()\-]+$/.test(value) &&
        value.replace(/\D/g, '').length >= 10 &&
        value.replace(/\D/g, '').length <= 15;
    contact.setCustomValidity(
      isEmail || isPhone ? '' : 'Укажите электронную почту или телефон, включая код города.',
    );
    for (const id of ['size', 'wishes']) {
      const el = document.getElementById(id);
      el.setCustomValidity(el.value.trim() ? '' : 'Заполните это поле.');
      el.addEventListener('input', () => el.setCustomValidity(''), { once: true });
    }
    if (!form.reportValidity()) return;
    form.hidden = true;
    success.hidden = false;
    success.focus();
    form.reset();
  }
  submit.addEventListener('click', validateDemo);
  document.querySelector('#form-repeat').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    form.reset();
    contact.setCustomValidity('');
    document.querySelector('[name="model-type"]').focus();
  });
}
