'use strict';
document.documentElement.classList.add('js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
navigation.addEventListener('click', closeMenu);
window.addEventListener('blur', closeMenu);
window.addEventListener('resize', closeMenu);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});
const contactButton = document.querySelector('.contact-button');
contactButton.addEventListener('pointermove', (event) => {
  if (reducedMotion.matches || event.pointerType !== 'mouse') return;
  const rect = contactButton.getBoundingClientRect();
  contactButton.style.setProperty(
    '--mx',
    `${(event.clientX - rect.left - rect.width / 2) * 0.06}px`,
  );
  contactButton.style.setProperty(
    '--my',
    `${(event.clientY - rect.top - rect.height / 2) * 0.08}px`,
  );
});
contactButton.addEventListener('pointerleave', () => {
  contactButton.style.setProperty('--mx', '0px');
  contactButton.style.setProperty('--my', '0px');
});
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    document
      .querySelectorAll('[data-filter]')
      .forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('.catalog-row').forEach((row) => {
      row.hidden =
        button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter;
      if (!row.hidden) count++;
    });
    document.querySelector('#filter-count').textContent = `Показано проектов: ${count}`;
  }),
);
const form = document.querySelector('#request-form');
if (form) {
  const submit = document.querySelector('#demo-submit');
  const contact = document.querySelector('#contact');
  const success = document.querySelector('#form-success');
  submit.disabled = false;
  function validateContact() {
    const value = contact.value.trim();
    const valid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
      (/^[+\d\s()\-]+$/.test(value) &&
        value.replace(/\D/g, '').length >= 10 &&
        value.replace(/\D/g, '').length <= 15);
    contact.setCustomValidity(valid ? '' : 'Укажите телефон с кодом города или электронную почту.');
  }
  contact.addEventListener('input', validateContact);
  function check(event) {
    event.preventDefault();
    validateContact();
    for (const id of ['size', 'wishes']) {
      const field = document.getElementById(id);
      field.setCustomValidity(!field.required || field.value.trim() ? '' : 'Заполните это поле.');
    }
    if (!form.reportValidity()) return;
    form.reset();
    form.hidden = true;
    success.hidden = false;
    success.focus();
    form.dispatchEvent(new Event('demo-checked'));
  }
  for (const id of ['size', 'wishes'])
    document
      .getElementById(id)
      .addEventListener('input', (event) => event.target.setCustomValidity(''));
  form.addEventListener('submit', check);
  document.querySelector('#form-repeat').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    contact.setCustomValidity('');
    document.querySelector('#object-name').focus();
  });
}
