'use strict';
(() => {
  const {materials,defaults,geometry,artwork}=window.Bagetbat;
  const id=key=>document.getElementById(key);
  const valueIds={w:'art-w',h:'art-h',left:'left',right:'right',top:'top',bottom:'bottom'};
  const names={w:'Ширина',h:'Высота',left:'Поле слева',right:'Поле справа',top:'Верхнее поле',bottom:'Нижнее поле'};
  const fmt=n=>Number(n.toFixed(1)).toLocaleString('ru-RU');
  const dims=(w,h)=>fmt(w)+' × '+fmt(h)+' см';
  const form=id('demo-form'),result=id('success');
  let photoURL='',imageRevision=0;
  function checked(name){return document.querySelector('input[name="'+name+'"]:checked').value;}
  function select(name,value){const el=[...document.getElementsByName(name)].find(el=>el.value===value);if (el) el.checked=true;}
  const url=new URL(location.href);
  select('profile',url.searchParams.get('profile'));select('mat',url.searchParams.get('mat'));
  const photoLabel=()=>photoURL?'Своё изображение':'Натюрморт «Лимоны»';
  function parse(s,min,max){
    if(!/^\d{1,3}(?:[.,]\d)?$/.test(s.trim()))return null;
    const n=Number(s.trim().replace(',','.'));
    return n>=min&&n<=max?n:null;
  }
  function readInputs(){
    const profile=checked('profile'),mat=checked('mat');
    const state={profile,mat},errors=[];
    id('margins').disabled=mat==='none';
    for (const [key,inputId] of Object.entries(valueIds)){
      const field=id(inputId), isArt=key==='w'||key==='h';
      if(!isArt&&mat==='none'){state[key]=0;field.removeAttribute('aria-invalid');continue;}
      const min=isArt?1:0,max=isArt?200:25;
      state[key]=parse(field.value,min,max);
      if(state[key]===null){
        field.setAttribute('aria-invalid','true');
        errors.push({field,message:names[key]+' — введите от '+min+' до '+max+' см, максимум один знак после запятой.'});
      } else field.removeAttribute('aria-invalid');
    }
    return {state,errors};
  }
  function showSpecs(rows){
    const dl=document.createElement('dl');dl.className='spec-rows';
    for(const [k,v] of rows){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;row.append(dt,dd);dl.append(row);}
    id('spec-summary').replaceChildren(dl);
  }
  function edit(switchView=false){
    if(result.hidden)return;
    result.hidden=true;form.hidden=false;
    if(switchView)focusAt(id('client-name'));
  }
  function update(){
    const {state,errors}=readInputs();id('size-error').textContent=errors[0]?.message||'';
    if(errors.length){
      id('preview-caption').textContent='Проверьте размеры';id('preview-dims').textContent='';
      id('material-caption').textContent='Эскиз обновится после исправления размера.';
      id('mini-dims').textContent='Проверьте размеры';
      id('spec-summary').textContent=errors[0].message;return null;
    }
    const g=geometry(document.querySelector('[data-frame="preview"]'),state,photoURL||artwork);
    geometry(document.querySelector('[data-frame="mini"]'),state,photoURL||artwork);
    const {profile,mat,totalW,totalH}=g;
    id('preview-caption').textContent=photoLabel();
    id('preview-dims').textContent=dims(totalW,totalH);
    id('mini-dims').textContent=dims(totalW,totalH);
    id('material-caption').textContent=profile.name+' · '+profile.article+(mat?' / '+mat.name+' · '+mat.article:' / Без паспарту');
    const rows=[['Изображение',photoLabel()],['Размер работы',dims(state.w,state.h)],['Профиль',profile.name+' · '+profile.article+' · '+profile.material.toLowerCase()+', '+profile.width+' мм'],['Паспарту',mat?mat.name+' · '+mat.article:'Без паспарту']];
    if(mat) rows.push(['Поля','Слева '+fmt(state.left)+', справа '+fmt(state.right)+', сверху '+fmt(state.top)+', снизу '+fmt(state.bottom)+' см']);
    rows.push(['Габариты эскиза',dims(totalW,totalH)]);
    showSpecs(rows);return {state,rows};
  }
  function focusAt(el){
    el.focus({preventScroll:true});
    el.scrollIntoView({block:'start',behavior:'instant'});
  }
  function validConfig(){
    if(update())return true;
    focusAt(document.querySelector('.numeric input[aria-invalid="true"]'));return false;
  }
  for(const key of Object.values(valueIds)){
    id(key).addEventListener('input',()=>{edit();update();});
  }
  for(const field of document.querySelectorAll('.radio-tile input')){
    field.addEventListener('change',()=>{edit();update();});
  }
  const upload=id('upload');
  function releasePhoto(){
    imageRevision++;
    if(photoURL) URL.revokeObjectURL(photoURL);
    photoURL='';upload.value='';id('remove-photo').hidden=true;id('upload-label').textContent='Примерить своё фото';id('upload-error').textContent='';
  }
  upload.addEventListener('change',async()=>{
    const file=upload.files[0];if(!file)return;
    const turn=++imageRevision;id('upload-error').textContent='';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){
      id('upload-error').textContent='Выберите JPG, PNG или WebP размером до 15 МБ.';upload.value='';return;
    }
    const next=URL.createObjectURL(file);
    const pic=new Image();pic.src=next;
    try {
      await pic.decode();
      if(turn!==imageRevision){URL.revokeObjectURL(next);return;}
      if(photoURL)URL.revokeObjectURL(photoURL);photoURL=next;
      id('remove-photo').hidden=false;id('upload-label').textContent='Заменить фото';edit();update();
    } catch {
      URL.revokeObjectURL(next);
      if(turn===imageRevision){id('upload-error').textContent='Изображение не открылось. Выберите другой файл.';upload.value='';}
    }
  });
  id('remove-photo').addEventListener('click',()=>{releasePhoto();edit();update();upload.focus();});
  function resetChoice(){
    for(const [key,inputId] of Object.entries(valueIds)) id(inputId).value=defaults[key];
    select('profile',defaults.profile);select('mat',defaults.mat);releasePhoto();edit();update();
    // A reload after an explicit reset starts from the same selection.
    const clearURL=new URL(location.href);clearURL.searchParams.delete('profile');clearURL.searchParams.delete('mat');
    history.replaceState(null,'',clearURL);
  }
  function editSelection(){focusAt(id('art-w'));}
  id('reset-selection').addEventListener('click',()=>{resetChoice();id('selection-status').textContent='Подбор сброшен.';editSelection();});
  id('to-request').addEventListener('click',()=>{if(validConfig()){edit();if(location.hash!=='#request')history.pushState(null,'','#request');focusAt(id('request'));}});
  id('adjust').addEventListener('click',ev=>{ev.preventDefault();if(location.hash!=='#settings')history.pushState(null,'','#settings');edit();editSelection();});
  function contactError(field){
    const value=field.value.trim();
    if(field.id==='client-name')return value?'':'Укажите имя.';
    const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const digits=value.replace(/\D/g,'');
    const phone=/^\+?[\d\s().-]+$/.test(value)&&digits.length>=7&&digits.length<=15;
    return email||phone?'':'Укажите телефон с кодом города или электронную почту.';
  }
  function validateField(field){
    const err=contactError(field);id(field.id==='client-name'?'name-error':'contact-error').textContent=err;
    if(err)field.setAttribute('aria-invalid','true');else field.removeAttribute('aria-invalid');return !err;
  }
  for(const field of [id('client-name'),id('client-contact')])field.addEventListener('input',()=>{if(field.hasAttribute('aria-invalid'))validateField(field);});
  form.addEventListener('submit',e=>{
    e.preventDefault();if(!validConfig())return;
    const fields=[id('client-name'),id('client-contact')];
    const bad=fields.filter(field=>!validateField(field));if(bad.length){focusAt(bad[0]);return;}
    form.hidden=true;result.hidden=false;focusAt(result);
  });
  id('edit-request').addEventListener('click',()=>edit(true));
  id('start-again').addEventListener('click',()=>{
    form.reset();for(const field of [id('client-name'),id('client-contact')])field.removeAttribute('aria-invalid');
    id('name-error').textContent='';id('contact-error').textContent='';resetChoice();
    history.replaceState(null,'',location.pathname+'#settings');editSelection();
  });
  addEventListener('pagehide',ev=>{if(!ev.persisted&&photoURL)URL.revokeObjectURL(photoURL);});
  // Reconcile radio/number values restored from session history with the rendered specification.
  addEventListener('pageshow',()=>update());update();
})();
