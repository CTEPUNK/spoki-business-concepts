'use strict';

const menu = document.querySelector('#site-menu');
const menuButton = document.querySelector('#menu-toggle');
const header = document.querySelector('header');
const contactLink = document.querySelector('.contact-link');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const menuNarrow = matchMedia('(max-width:900px)');

function closeMenu(returnFocus = false) {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  if (menu.classList.contains('open')) return closeMenu();
  menu.classList.add('open');
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Закрыть меню');
  menu.querySelector('a').focus({preventScroll:true});
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) closeMenu(true);
});
document.addEventListener('pointerdown', event => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
menu.addEventListener('click', () => closeMenu());
menuNarrow.addEventListener('change', () => closeMenu());

function bounded(value, lower = 0, upper = 1) {
  return Math.max(lower, Math.min(value, upper));
}
function magnetReset() {
  contactLink.style.removeProperty('--mag-x');
  contactLink.style.removeProperty('--mag-y');
}
contactLink.addEventListener('pointermove', event => {
  if (!finePointer.matches || motionPreference.matches || event.pointerType === 'touch') return;
  const rect = contactLink.getBoundingClientRect();
  contactLink.style.setProperty('--mag-x', ((event.clientX - rect.left) / rect.width - .5) * 7 + 'px');
  contactLink.style.setProperty('--mag-y', ((event.clientY - rect.top) / rect.height - .5) * 5 + 'px');
});
contactLink.addEventListener('pointerleave', magnetReset);

const hero = document.querySelector('.hero');
const plate = document.querySelector('.plate');
const allScenes = document.querySelectorAll('.motion-scene');
const scenes = new Set(allScenes);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) scenes.add(entry.target);
      else scenes.delete(entry.target);
    }
    requestMotion();
  }, {rootMargin: '180px 0px'});
  for (const scene of allScenes) observer.observe(scene);
}
let frame = 0;
let aimX = 0, aimY = 0;
function setStyle(element, key, value) { element.style.setProperty('--' + key, value); }
function renderMotion() {
  frame = 0;
  const reduced = motionPreference.matches;
  if (plate) {
    const progress = reduced ? 1 : bounded(window.scrollY / Math.max(170, hero.offsetHeight * .75));
    setStyle(plate, 'cover-dx', (-10 * (1-progress)).toFixed(2) + 'px');
    setStyle(plate, 'cover-dy', (-26 * (1-progress)).toFixed(2) + 'px');
    setStyle(plate, 'block-dy', (-8 * (1-progress)).toFixed(2) + 'px');
    setStyle(plate, 'spine-dx', (-7 * (1-progress)).toFixed(2) + 'px');
    setStyle(plate, 'book-x', (reduced ? 0 : aimX * 15).toFixed(2) + 'px');
    setStyle(plate, 'book-y', (reduced ? 0 : aimY * 10).toFixed(2) + 'px');
    setStyle(plate, 'book-angle', (reduced ? 0 : aimX * 5 + progress * 2).toFixed(2) + 'deg');
  }
  for (const scene of scenes) {
    const rect = scene.getBoundingClientRect();
    const progress = scene.classList.contains('inner-section-art')
      ? window.scrollY / (rect.height + 130)
      : (innerHeight - rect.top + 2) / (innerHeight * .72 + rect.height * .35);
    const p = reduced ? 1 : bounded(progress);
    const remain = 1 - p;
    if (scene.classList.contains('photo-window')) {
      setStyle(scene, 'photo-scale', (1 + .05 * remain).toFixed(4));
      continue;
    }
    for (const [key, travel] of [['board-x',-30],['board-y',16],['sheets-x',22],['sheets-y',-19],['thread-x',-21],['thread-y',-11],['sample-y',-12]]) {
      setStyle(scene, key, (travel * remain).toFixed(2) + 'px');
    }
  }
}
function requestMotion() { if (!frame) frame = requestAnimationFrame(renderMotion); }
if (hero) {
  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || motionPreference.matches || event.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    aimX = bounded((event.clientX - r.left) / r.width * 2 - 1, -1, 1);
    aimY = bounded((event.clientY - r.top) / r.height * 2 - 1, -1, 1);
    requestMotion();
  });
  hero.addEventListener('pointerleave', () => { aimX = 0; aimY = 0; requestMotion(); });
}
window.addEventListener('scroll', requestMotion, {passive:true});
window.addEventListener('resize', requestMotion, {passive:true});
motionPreference.addEventListener('change', () => { magnetReset(); aimX = 0; aimY = 0; requestMotion(); });
document.addEventListener('focusin', event => {
  const el = event.target;
  if (el.closest('header,dialog') || el === document.body) return;
  requestAnimationFrame(() => {
    if (document.activeElement !== el) return;
    const top = el.getBoundingClientRect().top, safeTop = header.getBoundingClientRect().bottom + 8;
    if (top < safeTop && top > -el.offsetHeight) window.scrollBy(0, top - safeTop);
  });
});
window.addEventListener('pageshow', requestMotion);
renderMotion();
