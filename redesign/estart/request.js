(() => {
  'use strict';
  const data=JSON.parse(document.getElementById('model-data').textContent);
  const $=s=>document.querySelector(s);
  const el=(tag,cls='',txt='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;return n;};
  const arrow=$('#submit-brief .arrow');
  const chevron=()=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','18');svg.setAttribute('height','18');svg.setAttribute('viewBox','0 0 20 20');svg.setAttribute('class','chev');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d','m4 7 6 6 6-6');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');path.setAttribute('fill','none');svg.append(path);return svg;
  };
  const link=(name,url,cls='sub-link')=>{const a=el('a',cls,name);a.href=url;a.append(arrow.cloneNode(true));return a;};
  const base='https://estadance.su';
  const atelier={
    'Европейская программа':['Бальное платье','Фрак','Тренировочный костюм'],
    'Латиноамериканская программа':['Бальное платье','Рубашка и брюки','Тренировочный костюм'],
    'Спортивные бальные танцы':['Рейтинговое платье','Тренировочный костюм','Фрак'],
    'Фламенко':['Юбка по образцу','Сценический костюм'],
    'Театр и шоу':['Театральный костюм','Костюм для шоу','Головной убор'],
    'Фигурное катание':['Костюм для фигурного катания'],
    'Гимнастика':['Купальник для гимнастики'],
    'Другое направление':['Костюм по эскизу','Аксессуар']
  };
  const directions=['Фламенко','Латиноамериканская программа','Европейская программа','Спортивные бальные танцы','Балет','Театр и шоу','Другое направление'];
  const colors={'чёрный':'#2b2028','синий':'#2e4082','красный':'#bb233d','розовый':'#eba2ba','белый':'#fff','голубой':'#9ac5e3','Dark Tan Satin':'#b47c58'};
  const ensembles=['Один исполнитель','Пара','Коллектив','Обсудить с ателье'];
  const custom='other',unsure='Уточнить';
  const form=$('#brief-form'),choices=$('#choices'),preview=$('.sheet-preview'),dialog=$('#picker'),results=$('#result');
  const originalArt=$('.swatches-art').innerHTML;
  let state,openKey='',opener=null,items=[];
  function initial(route='shop'){return {route,direction:'',item:'',color:'',size:'',sizeWish:'',custom:'',ensemble:'',comment:''};}
  function product(){return data.find(p=>p.id===state.item);}
  function title(key){return key==='direction'?(state.route==='atelier'?'Направление танца или сцены':'Направление танца'):'Изделие';}
  function itemList(){
    if(state.route==='atelier')return (atelier[state.direction]||[]).map(name=>[name,name]);
    const allowed=data.filter(p=>p.direction===state.direction||(state.direction==='Спортивные бальные танцы'&&p.direction==='Латиноамериканская программа'));
    return [...allowed.map(p=>[p.id,p.name]),[custom,'Другое изделие из каталога']];
  }
  function options(key){return key==='direction'?(state.route==='shop'?directions:Object.keys(atelier)).map(n=>[n,n]):itemList();}
  function nameOfItem(){
    if(state.route==='atelier')return state.item;
    if(state.item===custom)return state.custom.trim()||'Другое изделие из каталога';
    return product()?.name||'';
  }
  function clearVariants(){
    state.color='';state.size='';state.sizeWish='';state.custom='';state.ensemble=state.route==='atelier'&&state.item?'Обсудить с ателье':'';
    const p=product();
    if(p?.colors.length===1)state.color=p.colors[0];
    if(p?.sizes.length===1)state.size=p.sizes[0];
  }
  function selectField(key){
    const group=el('div','field'),label=el('label','field-label',title(key)),b=el('button','pick');
    label.htmlFor='pick-'+key;label.id='label-'+key;b.id=label.htmlFor;b.type='button';
    b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','picker');b.setAttribute('aria-expanded','false');
    const current=options(key).find(([v])=>v===state[key])?.[1];
    const value=el('span','',current||(key==='direction'?'Выберите направление':'Выберите изделие'));
    value.id='value-'+key;b.setAttribute('aria-labelledby',label.id+' '+value.id);
    if(!current)b.classList.add('is-empty');
    if(key==='item'&&!state.direction)b.disabled=true;
    b.append(value,chevron());b.addEventListener('click',()=>show(key,b));
    const error=el('p','error');error.id='error-'+key;error.setAttribute('aria-live','polite');
    b.setAttribute('aria-describedby',error.id);group.append(label,b,error);return group;
  }
  function textField(key,labelText,placeholder,optional=false){
    const g=el('div','field'),label=el('label','field-label',labelText),input=el('input','plain-input');
    input.type='text';input.id='field-'+key;label.htmlFor=input.id;
    if(optional)label.append(el('span','',' · по желанию'));
    input.maxLength=key==='sizeWish'?25:100;
    input.value=state[key];input.placeholder=placeholder;input.autocomplete='off';
    input.addEventListener('input',()=>{state[key]=input.value;input.removeAttribute('aria-invalid');error.textContent='';renderPreview();});
    const error=el('p','error');error.id='error-'+key;error.setAttribute('aria-live','polite');
    input.setAttribute('aria-describedby',error.id);g.append(label,input,error);return g;
  }
  function variants(key,name,list,fallback,swatches=false){
    const field=el('fieldset','variants'),legend=el('legend','',name),row=el('div','variant-options');
    const all=fallback?[...list,unsure]:list;
    for(const value of all){
      const label=el('label','variant'),input=el('input'),text=el('span');
      input.type='radio';input.name=key;input.value=value;input.checked=(state[key]||unsure)===value;
      if(swatches&&colors[value]){const dot=el('i','swatch');dot.setAttribute('aria-hidden','true');dot.style.setProperty('--swatch',colors[value]);text.append(dot);}
      text.append(document.createTextNode(value));
      input.addEventListener('change',()=>{state[key]=value;renderPreview();});
      label.append(input,text);row.append(label);
    }
    field.append(legend,row);return field;
  }
  function renderChoices(){
    const row=el('div','row-fields');row.append(selectField('direction'),selectField('item'));
    choices.replaceChildren(row);
    const p=product();
    if(state.item===custom&&state.route==='shop'){
      choices.append(textField('custom','Название или артикул','Как указано в каталоге'),link('Найти в официальных категориях','catalog.html#directory'));
    }else if(p&&state.route==='shop'){
      const line=['Арт. '+p.art,p.material,p.heel&&'каблук '+p.heel].filter(Boolean).join(' · ');
      choices.append(el('p','field-note',line));
      if(p.colors.length)choices.append(variants('color','Цвет по карточке',p.colors,p.colors.length>1,true));
      else choices.append(el('p','field-note','Варианты цвета магазин не перечисляет.'));
      if(p.sizes.length)choices.append(variants('size','Размер по карточке',p.sizes,p.sizes.length>1));
      else {
        choices.append(el('p','field-note',p.range?'Диапазон в карточке — '+p.range+'. Наличие нужного размера уточнит магазин.':'Размер в карточке не указан. Магазин уточнит его при обращении.'));
        choices.append(textField('sizeWish','Желаемый размер','Например, 40',true));
      }
    }else if(state.item&&state.route==='atelier'){
      choices.append(variants('ensemble','Для кого шьём',ensembles,false));
      choices.append(el('p','field-note','Материалы, мерки, срок и стоимость согласуют с ателье после обсуждения эскиза.'));
    }
    renderPreview();
  }
  function details(){
    const p=product(),rows=[['Способ заказа',state.route==='shop'?'Готовое изделие':'Пошив в ателье'],['Направление',state.direction],['Изделие',nameOfItem()]];
    if(p&&state.route==='shop'){
      rows.push(['Артикул',p.art],['Цвет',state.color&&state.color!==unsure?state.color:'Уточнить у магазина']);
      if(p.range)rows.push(['Диапазон по карточке',p.range]);
      rows.push([p.sizes.length?'Размер':'Желаемый размер',p.sizes.length?(state.size&&state.size!==unsure?state.size:'Уточнить у магазина'):(state.sizeWish.trim()||'Уточнить у магазина')]);
      if(p.material)rows.push([p.id==='latin'?'Состав':'Материал',p.material]);
      if(p.heel)rows.push(['Каблук',p.heel]);
      rows.push(['Цена в карточке',p.price]);
    }else if(state.route==='atelier'){rows.push(['Состав исполнителей',state.ensemble||'Обсудить с ателье']);}
    if(state.comment.trim())rows.push(['Комментарий',state.comment.trim()]);
    return rows;
  }
  function renderPreview(){
    const p=product();
    $('#preview-name').textContent=nameOfItem()||(state.route==='shop'?'Готовое изделие':'Пошив в ателье');
    const selected=[state.direction,p&&state.route==='shop'?'арт. '+p.art:'',state.color&&state.color!==unsure?state.color:'',state.size&&state.size!==unsure?'размер '+state.size:state.sizeWish.trim()?'желаемый размер '+state.sizeWish.trim():'',state.ensemble].filter(Boolean);
    $('#preview-detail').textContent=selected.join(' · ')||'Здесь появятся параметры выбранного изделия.';
    const image=$('.swatches-art'),src=$('#preview-source');
    src.replaceChildren();
    if(p&&state.route==='shop'){
      if(image.dataset.item!==p.id){
        const a=el('a','image-link'),img=el('img');a.href=p.category;a.setAttribute('aria-label',p.cat+' — категория Артсалона');
        img.src=p.photo;img.alt=p.alt;a.append(img);image.replaceChildren(a);image.dataset.item=p.id;
      }
      src.append(link('Карточка Артсалона',p.url));
    }else if(image.dataset.item){
      image.innerHTML=originalArt;delete image.dataset.item;
    }
  }
  function position(){
    if(!dialog.open||!opener)return;
    const r=opener.getBoundingClientRect(),header=$('.mast').getBoundingClientRect().bottom;
    const height=window.visualViewport?.height||innerHeight,width=document.documentElement.clientWidth;
    const edge=9,topLimit=header+6,available=Math.max(100,height-topLimit-edge);
    dialog.style.maxHeight=available+'px';dialog.style.width=Math.min(width-2*edge,Math.max(r.width,330))+'px';
    if(width<=640||height<450){
      dialog.style.width=Math.min(width-2*edge,500)+'px';
      dialog.style.left=Math.round((width-dialog.offsetWidth)/2)+'px';
      dialog.style.top=Math.max(topLimit,height-dialog.offsetHeight-edge)+'px';
    }else{
      dialog.style.left=Math.min(width-dialog.offsetWidth-edge,Math.max(edge,r.left))+'px';
      const down=r.bottom+5,up=r.top-dialog.offsetHeight-5;
      dialog.style.top=Math.max(topLimit,Math.min(height-edge-dialog.offsetHeight,down+dialog.offsetHeight<height-edge?down:up))+'px';
    }
  }
  function hide(restore=true){
    if(!dialog.open)return;
    dialog.close();opener?.setAttribute('aria-expanded','false');
    if(restore)opener?.focus({preventScroll:true});
  }
  function show(key,b){
    openKey=key;opener=b;items=options(key);$('#picker-title').textContent=title(key);
    const list=$('#option-list');list.replaceChildren();
    for(const [v,name] of items){
      const button=el('button','',name);button.type='button';button.dataset.value=v;
      button.setAttribute('role','option');button.setAttribute('aria-selected',String(state[key]===v));
      button.tabIndex=-1;
      button.addEventListener('focus',()=>{for(const option of list.children)option.tabIndex=option===button?0:-1;});
      button.addEventListener('click',()=>{
        hide(false);
        if(state[key]!==v){state[key]=v;if(key==='direction')state.item='';clearVariants();}
        renderChoices();$('#pick-'+key).focus({preventScroll:true});
      });
      list.append(button);
    }
    b.setAttribute('aria-expanded','true');dialog.showModal();position();
    (list.querySelector('[aria-selected="true"]')||list.firstElementChild)?.focus({preventScroll:true});
    const focused=document.activeElement;
    if(focused&&focused.closest('#option-list'))focused.scrollIntoView({block:'nearest'});
  }
  $('#close-picker').addEventListener('click',()=>hide());
  dialog.addEventListener('cancel',e=>{e.preventDefault();hide();});
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hide();
  });
  dialog.addEventListener('keydown',e=>{
    const buttons=[...$('#option-list').children];
    const index=buttons.indexOf(document.activeElement);
    if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
    e.preventDefault();
    const dest=e.key==='Home'?0:e.key==='End'?buttons.length-1:e.key==='ArrowDown'?Math.min(index+1,buttons.length-1):Math.max(0,index-1);
    buttons[dest]?.focus();
  });
  addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
  const routeFields=[...form.querySelectorAll('input[name="route"]')];
  routeFields.forEach(r=>r.addEventListener('change',()=>{
    const comment=state.comment;state=initial(r.value);state.comment=comment;renderChoices();
  }));
  $('#comment').addEventListener('input',e=>{state.comment=e.target.value;});
  function err(key,message,control){
    $('#error-'+key).textContent=message;control.setAttribute('aria-invalid','true');control.focus();control.scrollIntoView({block:'center'});return false;
  }
  function validate(){
    if(!state.direction)return err('direction','Выберите направление.',$('#pick-direction'));
    if(!state.item)return err('item','Выберите изделие.',$('#pick-item'));
    if(state.item===custom&&!state.custom.trim())return err('custom','Укажите название или артикул из каталога.',$('#field-custom'));
    return true;
  }
  function showStart(target){
    const h=target.getBoundingClientRect().top+scrollY-$('.mast').getBoundingClientRect().height-14;
    window.scrollTo({top:Math.max(0,h),behavior:'instant'});target.focus({preventScroll:true});
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();if(!validate())return;
    const summary=$('#summary');summary.replaceChildren();
    for(const [key,value] of details()){
      const row=el('div');row.append(el('dt','',key),el('dd','',value));summary.append(row);
    }
    const route=$('#order-route');route.replaceChildren();
    if(state.route==='atelier'){
      route.append(el('h3','','Обсудите пошив с ателье'),el('p','','Напишите в Дом моделей или позвоните. Эскиз, материалы, мерки, срок и смету мастерская согласует с вами.'),
        link('Написать в ателье','mailto:dm@estadance.su','button dark-red'),
        link('+7 (495) 951-00-84','tel:+74959510084'),link('Порядок заказа из региона',base+'/fashionhouse/order_in_regions'));
    }else{
      route.append(el('h3','','Уточните заказ в магазине'),el('p','','Позвоните в торговый дом, чтобы подтвердить размер, наличие и срок получения. В официальном бланке можно указать собранные параметры. Итоговую сумму с доставкой сообщит магазин.'),
        link('Бланк Артсалона',base+'/tradinghouse/order_of_the_goods/order_blank','button dark-red'),
        link('+7 (495) 674-16-70','tel:+74956741670'),link('Условия заказа',base+'/tradinghouse/order_of_the_goods'));
    }
    form.hidden=true;preview.hidden=true;results.hidden=false;showStart($('#result-title'));
  });
  $('#edit').addEventListener('click',()=>{
    results.hidden=true;form.hidden=false;preview.hidden=false;showStart($('#pick-direction'));
  });
  $('#reset').addEventListener('click',()=>{
    state=initial();form.reset();routeFields[0].checked=true;$('#comment').value='';renderChoices();
    history.replaceState(null,'',location.pathname+'#brief');
    results.hidden=true;form.hidden=false;preview.hidden=false;showStart($('#form-title'));
    routeFields[0].focus({preventScroll:true});
  });
  for(const a of document.querySelectorAll('#contacts .contact-step')){
    a.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      const desired=new URL(a.href).searchParams.get('route');
      if(desired!==state.route){
        const comment=state.comment;state=initial(desired);state.comment=comment;
        routeFields.forEach(r=>r.checked=r.value===desired);renderChoices();
      }
      form.hidden=false;preview.hidden=false;results.hidden=true;
      const params=new URLSearchParams();
      if(state.route==='atelier')params.set('route','atelier');
      else if(product())params.set('item',state.item);
      const search=params.size?'?'+params:'';
      history.pushState(null,'',location.pathname+search+'#brief');
      showStart($('#form-title'));
    });
  }
  const params=new URLSearchParams(location.search);
  const p=data.find(item=>item.id===params.get('item'));
  state=initial(!p&&params.get('route')==='atelier'?'atelier':'shop');
  if(p){state.direction=p.direction;state.item=p.id;clearVariants();}
  routeFields.forEach(r=>r.checked=r.value===state.route);
  $('#comment').value='';renderChoices();
})();
