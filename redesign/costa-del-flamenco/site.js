'use strict';

const one = (selector, parent = document) => parent.querySelector(selector);
const all = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setUpHeader() {
  const menu = one('#main-nav');
  const toggle = one('.menu-toggle');
  const mobile = window.matchMedia('(max-width: 1023px)');
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
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  if (document.body.dataset.page === 'school') {
    const schoolLinks = all('a[href^="school.html#"]',menu);
    function markSchoolLink(fragment) {
      schoolLinks.forEach(item => {
        if (item.hash === fragment) item.setAttribute('aria-current','location');
        else item.removeAttribute('aria-current');
      });
    }
    const markLocation = () => markSchoolLink(location.hash === '#prices' ? '#prices' : '#raspisanie');
    markLocation();
    schoolLinks.forEach(item => item.addEventListener('click',event=>{
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) markSchoolLink(item.hash);
    }));
    window.addEventListener('hashchange',markLocation);
  }

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
  all('[data-event-label]').forEach(label => {label.textContent='Из афиши театра';});
  const link=one('[data-ticket]');
  if (link) {
    link.href='https://safina.ru/news/';
    one('span',link).textContent='Новости театра';
    const note=one('.event-lead .helper');
    if(note) note.textContent='Дата этого показа прошла. Новые анонсы публикует театр.';
  }
  const homeAction=one('.hero-primary span');
  if(homeAction) homeAction.textContent='О спектакле';
  all('[data-show-action] span').forEach(span => {span.textContent='О спектакле';});
}
function setUpSectionIndex() {
  const nav = one('.section-index');
  if (!nav) return;
  const toggle = one('.index-toggle',nav);
  const links = all('#section-links a',nav);
  const chapters = links.map(link => document.getElementById(link.hash.slice(1)));
  const name = one('.index-now',nav);
  let current = -2;
  let scheduled = false;
  function setOpen(open) {
    nav.classList.toggle('is-open',open);
    toggle.setAttribute('aria-expanded',String(open));
  }
  function update() {
    scheduled = false;
    const line = one('.mast').getBoundingClientRect().bottom + nav.offsetHeight + 38;
    let index = -1;
    for (let i=0; i<chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top <= line) index=i;
    }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight-2) index=chapters.length-1;
    if (index === current) return;
    current = index;
    name.textContent = index < 0 ? 'Разделы' : links[index].textContent;
    links.forEach((link,i) => {
      if (i === index) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!scheduled) {scheduled=true;requestAnimationFrame(update);}
  }
  toggle.addEventListener('click',()=>setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if (!link) return;
    setOpen(false);
    const section=document.getElementById(link.hash.slice(1));
    section.setAttribute('tabindex','-1');
    section.focus({preventScroll:true});
    schedule();
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && nav.classList.contains('is-open')) {
      setOpen(false);toggle.focus({preventScroll:true});
    }
  });
  const closeOutside=event=>{if (!nav.contains(event.target)) setOpen(false);};
  document.addEventListener('pointerdown',closeOutside);
  document.addEventListener('focusin',closeOutside);
  window.matchMedia('(max-width: 1050px)').addEventListener('change',()=>setOpen(false));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('load',schedule,{once:true});
  update();
}

function setUpPhotoViewer() {
  const dialog = one('.viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const triggers = all('.photo-open');
  const stage = one('.viewer-stage',dialog);
  const controls = one('.viewer-controls',dialog);
  const image = document.createElement('img');
  image.draggable = false;
  let album = [];
  let index = 0;
  let trigger = null;
  let swipe = null;
  function show(i) {
    index=(i + album.length) % album.length;
    const item=album[index];
    if (!image.isConnected) stage.append(image);
    image.alt=one('img',item.parentElement).alt;
    image.src=item.href;
    one('#viewer-count',dialog).textContent='Фото '+(index+1)+' из '+album.length;
    one('#viewer-title',dialog).textContent=item.dataset.title;
    controls.hidden=album.length<2;
  }
  triggers.forEach(link=>link.addEventListener('click',event=>{
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger=link;
    album=triggers.filter(item=>item.dataset.album===link.dataset.album);
    show(album.indexOf(link));
    dialog.showModal();
  }));
  controls.addEventListener('click',event=>{
    const step=event.target.closest('[data-step]');
    if(step) show(index+Number(step.dataset.step));
  });
  dialog.addEventListener('keydown',event=>{
    if(album.length>1 && (event.key==='ArrowLeft' || event.key==='ArrowRight')) {
      event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));
    }
  });
  stage.addEventListener('pointerdown',event=>{
    if(event.isPrimary && event.pointerType==='touch') swipe={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  stage.addEventListener('pointercancel',()=>{swipe=null;});
  stage.addEventListener('pointerup',event=>{
    if(!swipe || swipe.id!==event.pointerId) return;
    const dx=event.clientX-swipe.x,dy=event.clientY-swipe.y;
    swipe=null;
    if(album.length>1 && Math.abs(dx)>48 && Math.abs(dx)>1.4*Math.abs(dy)) show(index+(dx<0?1:-1));
  });
  one('.viewer-close',dialog).addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close();
  });
  dialog.addEventListener('close',()=>{swipe=null;trigger?.focus({preventScroll:true});});
}

function setUpPointerLight() {
  const enabled=window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const rooms=all('#main > section');
  const cards=all('[data-card], .session, .hall-note, .form-wrap, .archive-stories article');
  const channels=[
    {key:'room',selector:'.pointer-room',active:'is-lit',vars:['--spot-x','--spot-y']},
    {key:'frame',selector:'.photo-frame',active:'is-aimed',vars:['--picture-x','--picture-y','--rim-w','--rim-h']},
    {key:'ink',selector:'h1,h2,h3,figcaption b,.show-time,.place-name',active:'ink-follow',vars:['--ink-x','--ink-y']},
    {key:'card',selector:'.pointer-card',active:'is-warm',vars:['--card-x','--card-y']}
  ];
  let pending=0, point=null;
  function switchElement(channel,next) {
    if(channel.el===next) return;
    if(channel.el) {
      channel.el.classList.remove(channel.active);
      channel.vars.forEach(name=>channel.el.style.removeProperty(name));
    }
    channel.el=next;
    if(next) next.classList.add(channel.active);
  }
  function reset() {
    cancelAnimationFrame(pending);pending=0;point=null;
    channels.forEach(channel=>switchElement(channel,null));
  }
  function paint() {
    pending=0;
    if(!point) return;
    for(const channel of channels) {
      const el=point.target.closest(channel.selector);
      switchElement(channel,el);
      if(!el) continue;
      const r=el.getBoundingClientRect();
      const x=Math.max(0,Math.min(r.width,point.x-r.left));
      const y=Math.max(0,Math.min(r.height,point.y-r.top));
      let values;
      if(channel.key==='frame') {
        const fx=x/Math.max(1,r.width), fy=y/Math.max(1,r.height);
        const dx=(fx*2-1)*Math.min(8,r.width*.022);
        const dy=(fy*2-1)*Math.min(5,r.height*.014);
        values=[dx.toFixed(2)+'px',dy.toFixed(2)+'px',(11+fx*24).toFixed(1)+'%',(12+fy*24).toFixed(1)+'%'];
      } else values=[Math.round(x)+'px',Math.round(y)+'px'];
      channel.vars.forEach((name,i)=>el.style.setProperty(name,values[i]));
    }
  }
  function move(event) {
    if(event.pointerType==='touch' || event.buttons || !event.target.closest('main')) {reset();return;}
    point={x:event.clientX,y:event.clientY,target:event.target};
    if(!pending) pending=requestAnimationFrame(paint);
  }
  const leave=event=>{if(!event.relatedTarget) reset();};
  function configure() {
    reset();
    rooms.forEach(el=>el.classList.toggle('pointer-room',enabled.matches));
    cards.forEach(el=>el.classList.toggle('pointer-card',enabled.matches));
    const bind=enabled.matches?'addEventListener':'removeEventListener';
    document[bind]('pointermove',move,{passive:true});
    document[bind]('pointerdown',reset,{passive:true});
    document[bind]('pointerout',leave,{passive:true});
    window[bind]('scroll',reset,{passive:true});
    window[bind]('blur',reset);
  }
  configure();enabled.addEventListener('change',configure);
}
setUpHeader();
setUpSectionIndex();
setUpPhotoViewer();
setUpPointerLight();
setUpMotion();
setUpFinder();
setUpForm();
updateDatedEvent();
