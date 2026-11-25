'use strict';

const one = (selector, parent = document) => parent.querySelector(selector);
const all = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setUpHeader() {
  const menu = one('#main-nav');
  const toggle = one('.menu-toggle');
  const mobile = window.matchMedia('(max-width: 700px)');
  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    one('path', toggle).setAttribute('d', open ? 'M5 5l14 14M5 19 19 5' : 'M3 8h18M3 16h18');
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) one('a', menu).focus({preventScroll:true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus({preventScroll:true});
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.mast')) setOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.mast')) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));

  const magnet = one('.contact-magnet');
  const face = one('.magnet-face', magnet);
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  magnet.addEventListener('pointermove', event => {
    if (!fine.matches || reducedMotion.matches || event.pointerType === 'touch') return;
    const box = magnet.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - .5) * 7;
    const y = ((event.clientY - box.top) / box.height - .5) * 6;
    face.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });
  const resetMagnet = () => { face.style.transform = ''; };
  magnet.addEventListener('pointerleave', resetMagnet);
  magnet.addEventListener('blur', resetMagnet);
  reducedMotion.addEventListener('change', resetMagnet);
}

function setUpMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = one('.hero');
    let disposeHero = () => {};
    if (hero) {
      const fan = one('.fan-tracker',hero);
      const body = one('.fan-body',hero);
      const leaves = all('.leaf',hero).map(node => ({
        node, fabric:one('.silk',node), position:Number(node.dataset.pos)
      }));
      const shadow = one('.fan-shadow',hero);
      const state = {x:0,y:0};
      let lastProgress = -1;
      function renderSpan(p) {
        if (p === lastProgress) return;
        lastProgress = p;
        const angle = 123 + 44*p;
        const halfBlade = angle/19 * Math.PI/360;
        const fabricWidth = Math.tan(halfBlade) / (22.4/281) * 1.035;
        for (const leaf of leaves) {
          leaf.node.setAttribute('transform', 'rotate(' + (leaf.position*angle - 12 + p*14).toFixed(3) + ')');
          leaf.fabric.setAttribute('transform','scale(' + fabricWidth.toFixed(5) + ' 1)');
        }
        shadow.setAttribute('rx', String(194 + p*53));
        body.setAttribute('transform','translate(0 ' + (-p*8).toFixed(2) + ')');
      }
      function renderPosition() {
        fan.setAttribute('transform','translate(' + (state.x*19).toFixed(2) + ' ' + (state.y*11).toFixed(2) + ') rotate(' + (state.x*8 - state.y*2).toFixed(2) + ')');
      }
      renderSpan(0);
      const setX=gsap.quickTo(state,'x',{duration:.25,ease:'power2.out',onUpdate:renderPosition});
      const setY=gsap.quickTo(state,'y',{duration:.25,ease:'power2.out',onUpdate:renderPosition});
      const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
      function follow(event) {
        if (event.pointerType === 'touch' || !fine.matches) return;
        const {left,top,width,height}=hero.getBoundingClientRect();
        setX(2*(event.clientX-left)/width-1);
        setY(2*(event.clientY-top)/height-1);
      }
      function settle() {setX(0);setY(0);}
      hero.addEventListener('pointermove',follow);
      hero.addEventListener('pointerleave',settle);
      ScrollTrigger.create({trigger:hero,start:0,end:()=>'+='+Math.max(160,hero.clientHeight*.67),onUpdate:self=>renderSpan(self.progress),onRefresh:self=>renderSpan(self.progress)});
      disposeHero = () => {
        hero.removeEventListener('pointermove',follow);
        hero.removeEventListener('pointerleave',settle);
        fan.removeAttribute('transform');
        body.removeAttribute('transform');
        renderSpan(.62);
      };
    }
    const frames=all('[data-scroll-photo]');
    frames.forEach(frame => {
      const update=self=>frame.style.setProperty('--progress', self.progress.toFixed(5));
      ScrollTrigger.create({trigger:frame,start:'top bottom',end:'bottom 8%',onUpdate:update,onRefresh:update});
    });
    return () => {disposeHero();frames.forEach(frame=>frame.style.removeProperty('--progress'));};
  });
  window.addEventListener('load', () => ScrollTrigger.refresh(),{once:true});
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  document.addEventListener('toggle', event => {if (event.target.tagName==='DETAILS') ScrollTrigger.refresh();},true);
}

function setUpFinder() {
  const results = one('#sessions');
  if (!results) return;
  const days=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
  const cards=all('.session',results);
  const filters=one('.picker-controls');
  const query=new URLSearchParams(location.search);
  function select(name, value) {
    const input=all('input[name="'+name+'"]',filters).find(item=>item.value===value);
    if (input) input.checked=true;
  }
  select('day',query.get('day'));
  select('part',query.get('time'));
  function update(writeUrl=true) {
    const day=one('[name="day"]:checked',filters).value;
    const part=one('[name="part"]:checked',filters).value;
    let count=0;
    for (const card of cards) {
      card.hidden=card.dataset.day!==day || (part!=='any' && part!==card.dataset.part);
      if (!card.hidden) count++;
    }
    const suffix=count===1?'занятие':count===0?'занятий':'занятия';
    one('#result-count').textContent=days[Number(day)]+' · '+count+' '+suffix;
    one('#empty').hidden=count!==0;
    one('#format-note').textContent=day==='5'
      ? 'В субботу опубликованы часы самоподготовки. Стоимость уточняйте в школе.'
      : 'Разовое групповое занятие — 1 200 ₽ за 1,5 часа.';
    if (writeUrl) {
      const next=new URL(location.href);
      if(day==='0') next.searchParams.delete('day'); else next.searchParams.set('day',day);
      if(part==='any') next.searchParams.delete('time'); else next.searchParams.set('time',part);
      history.replaceState(null,'',next);
    }
    window.ScrollTrigger?.refresh();
  }
  function focusDay(){one('[name="day"]:checked',filters).focus();}
  filters.addEventListener('change',()=>update());
  one('#reset-filter').addEventListener('click',()=>{select('day','0');select('part','any');update();focusDay();});
  one('#any-time').addEventListener('click',()=>{select('part','any');update();one('[name="part"]:checked',filters).focus();});
  window.addEventListener('pageshow',()=>update(false));
  update(false);
}

function setUpForm() {
  const form=one('#inquiry');
  if (!form) return;
  const subject=one('#subject'), person=one('#person'), email=one('#email');
  const lookup=JSON.parse(one('#group-names').textContent);
  const groupId=new URLSearchParams(location.search).get('group');
  function resetGroup(){subject.value=Object.hasOwn(lookup,groupId)?lookup[groupId]:'Вопрос о занятиях';}
  const fields=[subject,person,email];
  function errorText(field) {
    if (field===subject && !field.value.trim()) return 'Укажите, о чём хотите спросить.';
    if (field===person && !field.value.trim()) return 'Введите имя.';
    if (field===email && !field.value.trim()) return 'Введите электронную почту.';
    if (field===email && field.validity.typeMismatch) return 'Введите адрес в формате name@example.ru.';
    return '';
  }
  function showError(field, message) {
    one('#'+field.id+'-error').textContent=message;
    field.setAttribute('aria-invalid',String(Boolean(message)));
  }
  fields.forEach(field=>field.addEventListener('input',()=>{
    if(field.getAttribute('aria-invalid')==='true') showError(field,errorText(field));
  }));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const invalid=[];
    fields.forEach(field=>{
      const message=errorText(field);showError(field,message);
      if(message) invalid.push(field);
    });
    if(invalid.length){invalid[0].focus();return;}
    form.hidden=true;
    one('#success').hidden=false;
    one('#success h3').focus();
  });
  function edit(clear) {
    one('#success').hidden=true;
    form.hidden=false;
    if(clear){form.reset();resetGroup();fields.forEach(field=>showError(field,''));}
  }
  one('#edit-form').addEventListener('click',()=>{edit(false);subject.focus();});
  one('#new-form').addEventListener('click',()=>{edit(true);person.focus();});
  window.addEventListener('pagehide',()=>edit(true));
  resetGroup();one('#form-fields').disabled=false;
}

function updateDatedEvent() {
  if (Date.now()<Date.parse('2026-11-28T19:30:00+03:00')) return;
  const label=one('[data-event-label]');
  if(label) label.textContent='Из афиши театра';
  const link=one('[data-ticket]');
  if (link) {
    link.href='https://safina.ru/news/';
    one('span',link).textContent='Новости театра';
    const note=one('.event-lead .helper');
    if(note) note.textContent='Дата этого показа прошла. Новые анонсы публикует театр.';
  }
  const homeAction=one('.hero-primary span');
  if(homeAction) homeAction.textContent='О спектакле';
}
setUpHeader();
setUpMotion();
setUpFinder();
setUpForm();
updateDatedEvent();
