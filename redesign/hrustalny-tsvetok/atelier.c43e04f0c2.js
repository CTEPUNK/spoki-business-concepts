'use strict';

const one = (selector, parent = document) => parent.querySelector(selector);
const all = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function setupNavigation() {
  const menu = one('#navigation');
  const toggle = one('.menu-toggle');
  function close(restoreFocus = false) {
    menu.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    if (menu.hasAttribute('data-open')) return close();
    menu.setAttribute('data-open', '');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Закрыть меню');
    menu.querySelector('a').focus({preventScroll:true});
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.hasAttribute('data-open')) close(true);
  });
  document.addEventListener('click', e => {
    if (menu.hasAttribute('data-open') && (!e.target.closest('.top') || e.target.closest('a'))) close();
  });
  document.addEventListener('focusin', e => {
    if (!e.target.closest('.top') && menu.hasAttribute('data-open')) close();
    if (!e.target.closest('main') || e.target.matches('main') || e.target.closest('dialog[open]')) return;
    requestAnimationFrame(() => {
      if (e.target !== document.activeElement) return;
      const top = one('.top').getBoundingClientRect().bottom + 9;
      const r = e.target.getBoundingClientRect();
      if (r.top < top && r.bottom > 0) window.scrollBy(0, r.top - top);
    });
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', () => close());
  const contact = one('.contact-link');
  function clearMagnet() {
    contact.style.removeProperty('--mx');
    contact.style.removeProperty('--my');
  }
  contact.addEventListener('pointermove', e => {
    if (motion.matches || !finePointer.matches || e.pointerType === 'touch') return;
    const box = contact.getBoundingClientRect();
    contact.style.setProperty('--mx', ((e.clientX - box.left) / box.width - .5) * 7 + 'px');
    contact.style.setProperty('--my', ((e.clientY - box.top) / box.height - .5) * 5 + 'px');
  });
  contact.addEventListener('pointerleave', clearMagnet);
  motion.addEventListener('change',clearMagnet);
}

function setupArtwork() {
  const hero = one('.hero');
  const stage = one('.hero-stage');
  const diagrams = all('[data-scroll-art]');
  let pointX = 0, pointY = 0, requested = false;
  function render() {
    requested = false;
    if (motion.matches) return;
    if (stage) {
      const rect = hero.getBoundingClientRect();
      const progress = clamp((one('.top').offsetHeight - rect.top) / Math.max(175, rect.height * .77), 0, 1);
      const vars = {
        '--move-x': pointX * 23 + 'px', '--move-y': pointY * 12 + 'px',
        '--tilt-y': pointX * 10 + progress * 6 + 'deg', '--tilt-x': -pointY * 6 + 'deg',
        '--lift': -progress * 19 + 'px', '--bloom': progress * 26 + 'px',
        '--cast-y': -progress * 64 + 'px', '--beam-x': progress * 83 + 'px',
        '--shine-x': -34 + progress * 141 + pointX * 13 + 'px'
      };
      for (const [key,value] of Object.entries(vars)) stage.style.setProperty(key,value);
    }
    for (const art of diagrams) {
      const rect = art.getBoundingClientRect();
      const progress = clamp((innerHeight - rect.top) / (innerHeight + rect.height * .62), 0, 1);
      const k = 1 - progress;
      art.style.setProperty('--ax',(-31 * k) + 'px');
      art.style.setProperty('--ay',(-18 * k) + 'px');
      art.style.setProperty('--bx',(22 * k) + 'px');
      art.style.setProperty('--by',(10 * k) + 'px');
    }
  }
  function schedule() {
    if (requested) return;
    requested = true;
    requestAnimationFrame(render);
  }
  if (hero) {
    hero.addEventListener('pointermove', e => {
      if (motion.matches || !finePointer.matches || e.pointerType === 'touch') return;
      const b = stage.getBoundingClientRect();
      pointX = clamp((e.clientX - b.left) / b.width * 2 - 1,-1,1);
      pointY = clamp((e.clientY - b.top) / b.height * 2 - 1,-1,1);
      schedule();
    });
    hero.addEventListener('pointerleave', () => { pointX = pointY = 0; schedule(); });
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  motion.addEventListener('change',schedule);
  schedule();
}

function setupBuilder() {
  const form = one('#builder');
  if (!form) return;
  const db = JSON.parse(one('#catalog-data').textContent);
  const fields = form.elements;
  const steps = all('[data-step]', form);
  const progress = all('.steps li');
  const stepError = one('#step-error');
  const options = one('#sketch-options');
  const code = one('#code'), idea = one('#idea'), width = one('#width'), height = one('#height');
  const original = one('#original-sketch');
  const preview = one('.preview');
  const previewHome = preview.parentElement;
  let current = 1;
  let spec = null;
  let selectedSketch = '';
  let copySequence = 0;

  function setRadio(group, value) {
    const radio = all('input[type=radio]', form).find(r => r.name === group && r.value === value);
    if (radio) radio.checked = true;
  }
  function checkedLabel(name) {
    return one('input[name="'+name+'"]:checked',form).nextElementSibling.querySelector('strong').textContent;
  }
  function clearError(field) {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
  function resetErrors() {
    all('[aria-invalid]',form).forEach(clearError);
    stepError.hidden = true;
    stepError.textContent = '';
  }
  function problem(field, message) {
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby','step-error');
    stepError.textContent = message;
    stepError.hidden = false;
    field.focus();
    return false;
  }
  function makeOption(id, label, desc) {
    const wrap = document.createElement('label');
    wrap.className = 'option';
    const inp = document.createElement('input');
    inp.type = 'radio'; inp.name = 'sketch'; inp.value = id;
    const span = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = label;
    span.append(title);
    if (desc) {
      const sub = document.createElement('small'); sub.textContent = desc; span.append(sub);
    }
    wrap.append(inp,span);
    return wrap;
  }
  function updateSource() {
    const known = db.sketches.find(x => x.id === selectedSketch);
    const manual = !known;
    one('#code-field').hidden = !manual;
    original.href = known?.url || db.catalogs[fields.purpose.value] || db.catalogs.all;
    one('span',original).textContent = known ? 'Открыть рисунок '+known.code+' у мастерской' : 'Открыть каталог мастерской';
  }
  function updateSketches(preferred) {
    const valid = db.sketches.filter(x=>x.purpose === fields.purpose.value);
    selectedSketch = valid.some(x=>x.id===preferred) || preferred==='other' ? preferred : valid[0]?.id || 'other';
    options.replaceChildren(...valid.map(x=>makeOption(x.id,x.code,x.title)),makeOption('other','Свой артикул','Из полного каталога'));
    setRadio('sketch',selectedSketch);
    updateSource();
  }
  function showMode() {
    const custom = fields.mode.value === 'idea';
    one('#catalog-field').hidden = custom;
    one('#idea-field').hidden = !custom;
  }
  function dimension(field) {
    const text = field.value.trim().replace(',','.');
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function readableDimension(field) {
    const [whole, decimals = ''] = field.value.trim().replace(',', '.').split('.');
    const integer = (whole || '0').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const fraction = decimals.replace(/0+$/, '');
    return fraction ? integer + ',' + fraction : integer;
  }
  function updatePreview() {
    const w = dimension(width), h = dimension(height), valid = w !== null && h !== null;
    const rect = one('#size-rect'), axis = one('#size-axis');
    const label = valid ? readableDimension(width) + ' × ' + readableDimension(height) + ' мм' : 'Задайте ширину и высоту';
    const factor = valid ? Math.min(208/w,125/h) : 0;
    const sw = valid ? w*factor : 0, sh = valid ? h*factor : 0;
    const x = (260-sw)/2, y = (160-sh)/2+3;
    for(const [key,val] of Object.entries({x,y,width:sw,height:sh})) rect.setAttribute(key,String(val));
    axis.setAttribute('d',valid ? 'M'+x+' '+(y+sh+7)+'h'+sw+'m0 -3v6m-'+sw+' -6v6' : '');
    one('#size-label').textContent = label;
    one('#panel-preview').setAttribute('aria-label',valid ? 'Пропорции панели, '+label : 'Габариты пока не заданы');
  }
  function eraseResult() {
    if (one('#enquiry').hidden) resetEnquiry();
    spec = null;
    copySequence++;
    one('#spec').replaceChildren();
    one('#enquiry-spec').textContent = '';
    one('#copy-status').textContent = '';
    one('#copy-fallback').hidden = true;
    one('#copy-fallback').value = '';
  }
  function show(step, focus = true) {
    current = step;
    resetErrors();
    steps.forEach((panel,i)=>{panel.hidden = i+1!==step;});
    progress.forEach((item,i)=>{
      if(i+1===step) item.setAttribute('aria-current','step'); else item.removeAttribute('aria-current');
    });
    one('#step-controls').hidden = step===3;
    one('#back').hidden = step===1;
    one('#forward span').textContent = step === 1 ? 'К размерам и технике' : 'Получить спецификацию';
    if(step===3) one('#result-preview').append(preview); else previewHome.append(preview);
    if(focus) {
      const heading = one('h2',steps[step-1]);
      heading.focus({preventScroll:true}); heading.scrollIntoView({block:'start'});
    }
  }
  function validateDesign() {
    if(fields.mode.value==='idea' && !idea.value.trim()) return problem(idea,'Опишите рисунок или замысел.');
    if(fields.mode.value==='catalog' && selectedSketch==='other' && !code.value.trim()) return problem(code,'Введите артикул или название из каталога.');
    return true;
  }
  function buildResult() {
    if(dimension(width)===null) return problem(width,'Введите ширину в миллиметрах числом больше нуля.');
    if(dimension(height)===null) return problem(height,'Введите высоту в миллиметрах числом больше нуля.');
    const design=db.sketches.find(x=>x.id===selectedSketch);
    const ideaMode=fields.mode.value==='idea';
    const value=ideaMode ? idea.value.trim() : design ? design.code+' — '+design.title : code.value.trim();
    spec=[['Назначение',checkedLabel('purpose')],[ideaMode?'Свой замысел':'Эскиз',value],['Ширина',readableDimension(width)+' мм'],['Высота',readableDimension(height)+' мм'],['Техника',checkedLabel('technique')]];
    const holder=one('#spec');holder.replaceChildren();
    for(const [key,text] of spec) {
      const pair=document.createElement('div'),term=document.createElement('dt'),def=document.createElement('dd');
      term.textContent=key;def.textContent=text;pair.append(term,def);holder.append(pair);
    }
    one('#enquiry-spec').textContent='К форме добавлена спецификация для витража. '+checkedLabel('purpose')+', '+one('#size-label').textContent+'.';
    show(3);
    return true;
  }
  form.addEventListener('input', e=>{
    if(e.target.matches('input,textarea') && e.target.hasAttribute('aria-invalid')) resetErrors();
    if(e.target===width || e.target===height) updatePreview();
  });
  form.addEventListener('change', e=>{
    const name=e.target.name;
    if(name==='purpose') updateSketches();
    if(name==='mode') showMode();
    if(name==='sketch') {selectedSketch=e.target.value;updateSource();}
    resetErrors();
  });
  form.addEventListener('submit', e=>{
    e.preventDefault();resetErrors();
    if(current===1 && validateDesign()) show(2);
    else if(current===2) buildResult();
  });
  one('#back').addEventListener('click',()=>show(1));
  all('[data-edit]').forEach(b=>b.addEventListener('click',()=>{eraseResult();show(Number(b.dataset.edit));}));
  function reset() {
    form.reset();
    eraseResult(); updateSketches(); showMode();updatePreview();show(1);
    const next=new URL(location.href);next.searchParams.delete('purpose');next.searchParams.delete('sketch');next.searchParams.delete('mode');next.hash='';
    history.replaceState(null,'',next);
    resetEnquiry();
  }
  one('#start-over').addEventListener('click',reset);
  one('#copy-spec').addEventListener('click',async()=>{
    if(!spec) return;
    const sequence=++copySequence;
    const text='Спецификация витража\n'+spec.map(([k,v])=>k+': '+v).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      if(sequence===copySequence) one('#copy-status').textContent='Спецификация скопирована.';
    } catch {
      if(sequence!==copySequence) return;
      const fallback=one('#copy-fallback');
      fallback.value=text;fallback.hidden=false;fallback.focus();fallback.select();
      one('#copy-status').textContent='Текст спецификации выделен для копирования.';
    }
  });
  const enquiry=one('#enquiry'), email=one('#email'), emailError=one('#email-error');
  function resetEnquiry() {
    enquiry.reset();enquiry.hidden=false;one('#enquiry-done').hidden=true;
    clearError(email);emailError.hidden=true;emailError.textContent='';
  }
  enquiry.addEventListener('submit',e=>{
    e.preventDefault();
    if(!email.validity.valid || !email.value.trim()) {
      emailError.textContent='Введите электронную почту, например name@example.ru.';
      emailError.hidden=false;email.setAttribute('aria-invalid','true');email.setAttribute('aria-describedby','email-error');email.focus();return;
    }
    resetEnquiry();enquiry.hidden=true;one('#enquiry-done').hidden=false;
    one('#enquiry-done h4').focus();
  });
  email.addEventListener('input',()=>{clearError(email);emailError.hidden=true;});
  one('#enquiry-again').addEventListener('click',()=>{resetEnquiry();email.focus();});
  const params=new URLSearchParams(location.search);
  const picked=db.sketches.find(x=>x.id===params.get('sketch'));
  if(picked) setRadio('purpose',picked.purpose); else if(params.has('purpose')) setRadio('purpose',params.get('purpose'));
  if(params.get('mode')==='idea') setRadio('mode','idea');
  updateSketches(picked?.id);showMode();updatePreview();show(1,false);
}

setupNavigation();
setupArtwork();
setupBuilder();
