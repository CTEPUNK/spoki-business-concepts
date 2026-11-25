(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const menu = document.querySelector('.menu-btn');
  const menuPanel = document.getElementById('mobile-nav');
  function closeMenu(returnFocus = false) {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    menuPanel.hidden = true;
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    if (!menuPanel.hidden) return closeMenu();
    menuPanel.hidden = false;
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Закрыть меню');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menuPanel.hidden) closeMenu(true);
  });
  document.addEventListener('click', e => {
    if (!menuPanel.hidden && (!e.target.closest('.mast') || e.target.closest('#mobile-nav a'))) closeMenu();
  });
  document.addEventListener('focusin', e => {
    if (!menuPanel.hidden && !e.target.closest('.mast')) closeMenu();
  });
  window.addEventListener('pageshow', () => closeMenu());
  matchMedia('(max-width: 760px)').addEventListener('change', () => closeMenu());
  const contact = document.querySelector('.contacts-btn');
  function resetMagnet() { contact.removeAttribute('style'); }
  contact.addEventListener('pointermove', e => {
    if (!fine.matches || reduced.matches || e.pointerType === 'touch') return;
    const r = contact.getBoundingClientRect();
    contact.style.setProperty('--mx', ((e.clientX-r.left)/r.width-.5)*6+'px');
    contact.style.setProperty('--my', ((e.clientY-r.top)/r.height-.5)*4+'px');
  });
  contact.addEventListener('pointerleave',resetMagnet);
  const hero = document.querySelector('.hero');
  const body = document.getElementById('chip-body');
  const shadow = document.getElementById('chip-shadow');
  const socket = document.querySelector('.socket-art');
  const scenes = [...document.querySelectorAll('[data-scroll]')];
  const inkSelector = 'h1, h2, h3, .hero-desc, .part-desc, .list-label strong, .address, .lead';
  const clamp = n => Math.max(0, Math.min(1, n));
  let pointer = null;
  let surface = null;
  let ink = null;
  let frame = 0;
  let scrollChanged = true;
  let heroProgress = 0;

  function updateScroll(motion) {
    if (hero) heroProgress = motion ? clamp(scrollY / Math.max(140, hero.offsetHeight * .74)) : 0;
    const vh = window.innerHeight;
    for (const scene of scenes) {
      const rect = scene.getBoundingClientRect();
      const progress = !motion ? 1 : scene.classList.contains('inner-heading')
        ? clamp(scrollY / Math.max(120, rect.height * 1.6))
        : clamp((vh - rect.top) / (vh * .72 + Math.min(rect.height, 360) * .58));
      scene.style.setProperty('--lead-left', -32 * (1 - progress) + 'px');
      scene.style.setProperty('--lead-right', 32 * (1 - progress) + 'px');
      scene.style.setProperty('--part-y', -13 * (1 - progress) + 'px');
      scene.style.setProperty('--photo-x', (motion ? 4.2 - 8.4 * progress : 0) + 'px');
    }
  }

  function updateHero(x, y) {
    const dx = x * 27 + heroProgress * 12;
    const dy = y * 18 + heroProgress * 43;
    const angle = x * 4.8 - heroProgress * 9;
    body.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + angle + 'deg) scale(' + (1.11 + heroProgress * .035) + ')';
    shadow.style.transform = 'translate(' + dx * .38 + 'px,' + dy * .22 + 'px) scale(' + (1 + heroProgress * .10) + ')';
    socket.style.transform = 'translateY(' + -heroProgress * 10 + 'px) scale(1.04)';
  }

  function paint() {
    frame = 0;
    if (scrollChanged) updateScroll(!reduced.matches);
    const target = pointer && fine.matches && !reduced.matches
      ? document.elementFromPoint(pointer.x, pointer.y) : null;
    const next = target && target.closest('[data-cursor-surface]');
    const nextInk = next && target.closest(inkSelector);
    const wasOnHero = hero && surface === hero;
    if (surface !== next) {
      if (surface) surface.removeAttribute('data-pointed');
      surface = next;
    }
    if (ink !== nextInk) {
      if (ink) ink.removeAttribute('data-cursor-ink');
      ink = nextInk;
    }

    let x = 0, y = 0;
    if (surface) {
      const r = surface.getBoundingClientRect();
      const dx = pointer.x - r.left, dy = pointer.y - r.top;
      x = clamp(dx / Math.max(1, r.width)) * 2 - 1;
      y = clamp(dy / Math.max(1, r.height)) * 2 - 1;
      surface.style.setProperty('--surface-x', dx.toFixed(1) + 'px');
      surface.style.setProperty('--surface-y', dy.toFixed(1) + 'px');
      surface.style.setProperty('--axis-x', x.toFixed(3));
      surface.style.setProperty('--axis-y', y.toFixed(3));
      surface.toggleAttribute('data-pointed', true);
    }
    if (ink) {
      const r = ink.getBoundingClientRect();
      ink.style.setProperty('--ink-x', (pointer.x - r.left).toFixed(1) + 'px');
      ink.style.setProperty('--ink-y', (pointer.y - r.top).toFixed(1) + 'px');
      ink.toggleAttribute('data-cursor-ink', true);
    }
    if (hero && (scrollChanged || wasOnHero || surface === hero)) {
      updateHero(surface === hero ? x : 0, surface === hero ? y : 0);
    }
    scrollChanged = false;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }
  function resetPointer() {
    if (!pointer && !surface && !ink) return;
    pointer = null;
    schedule();
  }
  function layoutChanged() {
    scrollChanged = true;
    schedule();
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || e.buttons || !fine.matches || reduced.matches) return resetPointer();
    pointer = {x: e.clientX, y: e.clientY};
    schedule();
  }, {passive: true});
  document.documentElement.addEventListener('pointerleave', resetPointer);
  document.addEventListener('pointerdown', resetPointer, {passive: true});
  document.addEventListener('pointercancel', resetPointer, {passive: true});
  document.addEventListener('keydown', resetPointer);
  window.addEventListener('blur', resetPointer);
  window.addEventListener('pageshow', layoutChanged);
  window.addEventListener('scroll', layoutChanged, {passive: true, capture: true});
  window.addEventListener('resize', layoutChanged, {passive: true});
  for (const preference of [reduced, fine]) {
    preference.addEventListener('change', () => {
      resetPointer();
      resetMagnet();
      layoutChanged();
    });
  }
  paint();

  const dataElement=document.getElementById('shop-data');
  const data=dataElement ? JSON.parse(dataElement.textContent) : [];
  const symbols={
    'plus':'<path d="M5 12h14M12 5v14"/>','minus':'<path d="M5 12h14"/>',
    'close':'<path d="m6 6 12 12M18 6 6 18"/>','arrow':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    'check':'<path d="m4 12 5 5L20 6"/>','chev':'<path d="m6 9 6 6 6-6"/>',
    'copy':'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V4H4v12h4"/>'
  };
  function icon(key) {
    return '<svg width="20" height="20" aria-hidden="true" class="icon '+(key==='arrow'?'arrow':'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+symbols[key]+'</svg>';
  }
  function escape(value) {
    return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  const key='spoki-s10-draft-parts-v1';
  const byId=new Map(data.filter(p=>p.id).map(p=>[p.id,p]));
  function readList() {
    try {
      const saved=JSON.parse(sessionStorage.getItem(key)||'[]');
      const known=new Set();
      if (Array.isArray(saved)) return saved.filter(row=>{
        if (!row || !byId.has(row.id) || known.has(row.id) || !Number.isSafeInteger(row.qty) || row.qty<1) return false;
        known.add(row.id);return true;
      }).map(({id,qty})=>({id,qty}));
    } catch {}
    return [];
  }
  function saveList(list) { try {sessionStorage.setItem(key,JSON.stringify(list));} catch {} }
  const fmt=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
  const money=cents=>fmt.format(cents/100)+' ₽';
  function lineCents(part,qty) {
    return part.price!==null && (!part.lot || qty===part.lot) && Number.isSafeInteger(part.price*qty) ? part.price*qty : null;
  }
  function priceCondition(part) { return part.lot?'Цена за штуку при количестве '+fmt.format(part.lot)+' шт.':''; }
  function spec(list) {
    if (!list.length) return '';
    let sum=0, complete=true;
    const lines=list.map(({id,qty})=>{
      const part=byId.get(id), value=lineCents(part,qty);
      if (value===null) complete=false; else sum+=value;
      const info=[part.code,part.desc,part.mark?'код на корпусе '+part.mark:''].filter(Boolean).join(' · ');
      const cost=value===null?'цену уточнить':money(part.price)+' / '+part.unit+' = '+money(value);
      return '№ '+id+' · '+info+' — '+fmt.format(qty)+' '+part.unit+' · '+cost+(part.lot?' ('+priceCondition(part)+')':'');
    });
    return ['Список радиодеталей S-10',...lines,complete?'Сумма по выборке: '+money(sum):'Сумма позиций с известной ценой: '+money(sum),'Прайс от 25.11.2026. Без доставки и накопительной скидки.'].join('\n');
  }
  window.S10={data,byId,icon,escape,readList,saveList,money,fmt,lineCents,priceCondition,spec};
})();
