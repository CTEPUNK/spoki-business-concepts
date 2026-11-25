(() => {
  'use strict';
  const {data,byId,icon,escape:html,readList,saveList,money,fmt,lineCents,priceCondition,spec} = S10;
  const el=id=>document.getElementById(id);
  const query=el('part-query'),results=el('results'),more=el('more'),listArea=el('list-content'),status=el('list-state');
  let list=readList(),limit=8,copyVersion=0,nearbyOpen=false;
  const normal=v=>v.normalize('NFKC').trim().toLocaleUpperCase('ru-RU');
  function match(value) {
    const text=normal(value.trim().replace(/^(?:№|#)\s*(?=\d)/,''));
    if (!text) return {rows:data,label:'В выборке'};
    const exact=data.filter(p=>[p.id,p.code,p.mark].some(k=>k && normal(k)===text));
    if (exact.length) {
      const nearby=data.filter(p=>!exact.includes(p) && [p.code,p.mark].some(k=>k && normal(k).startsWith(text)));
      return {rows:exact,label:'Точное совпадение',nearby};
    }
    // Printed characters, numeric IDs and Cyrillic/Latin letters stay distinct.
    const rows=data.filter(p=>[p.code,p.mark,p.id].some(k=>k && normal(k).startsWith(text)));
    return {rows,label:'По началу маркировки или номера'};
  }
  function renderResults() {
    const {rows,label,nearby}=match(query.value);
    el('result-meta').textContent=rows.length?label+' · '+rows.length:'Совпадений в выборке нет';
    more.hidden=rows.length<=limit;
    more.textContent='Показать ещё '+Math.min(8,Math.max(0,rows.length-limit));
    if (!rows.length) {
      const url='https://s-10mitino.ru/s-10/prais/?q='+encodeURIComponent(query.value.trim());
      results.innerHTML='<div class="no-results"><h3>Позиция не найдена</h3><p>Проверьте цифры и суффикс. Этой маркировки может не быть в демопрайсе.</p><div class="inline-links"><button class="btn quiet" id="reset-query" type="button">Сбросить поиск</button><a class="textlink" href="'+html(url)+'">Искать в полном прайсе'+icon('arrow')+'</a></div></div>';
      return;
    }
    const primary=rows.slice(0,limit).map(rowHTML).join('');
    const neighbors=nearby?.length?'<div class="nearby"><button id="toggle-nearby" type="button" class="link-button" aria-expanded="'+nearbyOpen+'" aria-controls="nearby-rows">'+(nearbyOpen?'Скрыть похожие маркировки':'Показать похожие маркировки')+' ('+nearby.length+')</button><div id="nearby-rows" '+(nearbyOpen?'':'hidden')+'>'+(nearbyOpen?nearby.map(rowHTML).join(''):'')+'</div></div>':'';
    results.innerHTML=primary+neighbors;
  }
  function rowHTML(p) {
      const added=list.some(x=>x.id===p.id);
      const price=p.price===null?'<span class="row-price unknown">Цена не указана</span><span class="row-note">На дату прайса не было в наличии</span>':'<span class="row-price">'+money(p.price)+' <small>/ '+p.unit+'</small></span>';
      const condition=p.lot?'<span class="row-note">При '+fmt.format(p.lot)+' шт.</span>':'';
      const lengthInfo=p.unit==='м'?' · шаг резки 5 см':'';
      const marking=p.mark?' · код <b>'+html(p.mark)+'</b>':'';
      return '<article class="result-row" data-part="'+p.id+'"><div class="identity"><h3 class="part-code">'+html(p.code)+'</h3><p class="part-desc">'+html(p.desc)+marking+lengthInfo+'</p><a class="part-id" href="https://s-10mitino.ru/s-10/position/?pos='+p.id+'" aria-label="№ '+p.id+' — карточка '+html(p.code)+' в магазине">№ '+p.id+icon('arrow')+'</a></div><div class="purchase-info">'+price+condition+'</div><button class="btn add-part'+(added?' selected':'')+'" type="button" data-add="'+p.id+'" aria-label="'+(added?'В списке, перейти к позиции':'В список, добавить')+' '+html(p.code)+' № '+p.id+'">'+icon(added?'check':'plus')+(added?'В списке':'В список')+'</button></article>';

  }
  function setQuery(value,focus=false) {
    query.value=value;
    limit=8;nearbyOpen=false;
    const url=new URL(location.href);
    if (value.trim()) url.searchParams.set('q',value.trim()); else url.searchParams.delete('q');
    if (url.hash==='#list') url.hash='';
    history.replaceState(null,'',url);
    renderResults();
    if (focus) query.focus();
  }
  query.addEventListener('input',()=>setQuery(query.value));
  el('price-search').addEventListener('submit',e=>{e.preventDefault();setQuery(query.value);el('result-meta').focus();});
  document.querySelector('.quick-examples').addEventListener('click',e=>{
    const btn=e.target.closest('[data-q]');if (btn) setQuery(btn.dataset.q);
  });
  more.addEventListener('click',()=>{
    const before=limit;limit+=8;renderResults();
    const first=results.children[before]?.querySelector('a');if(first) first.focus();
  });
  function invalidateNotice() {copyVersion++;status.textContent='';}
  function persist(){saveList(list);invalidateNotice();}
  function renderList() {
    el('count-badge').textContent=list.length;
    if (!list.length) {
      listArea.innerHTML='<p class="empty-list">Добавляйте позиции из прайса. Здесь можно изменить количество и скопировать список.</p>';
      return;
    }
    let total=0,complete=true;
    const lines=list.map(({id,qty})=>{
      const p=byId.get(id),sum=lineCents(p,qty);
      if (sum!==null) total+=sum; else complete=false;
      const condition=priceCondition(p);
      return '<div class="list-item" data-line="'+id+'"><div class="list-label"><div><strong>'+html(p.code)+'</strong><div class="list-id">№ '+id+'</div></div><button class="delete-line" type="button" data-remove="'+id+'" aria-label="Удалить '+html(p.code)+' № '+id+'">'+icon('close')+'</button></div><div class="list-details">'+html(p.desc)+(p.mark?' · код '+html(p.mark):'')+'</div>'+(condition?'<div class="pick-note">'+condition+'</div>':'')+'<div class="qty-bar"><div class="qty-wrap"><button data-delta="-1" type="button" aria-label="Уменьшить количество '+html(p.code)+'">'+icon('minus')+'</button><input data-qty="'+id+'" type="text" inputmode="numeric" pattern="[0-9]*" value="'+qty+'" aria-label="Количество '+html(p.code)+' № '+id+'"><button data-delta="1" type="button" aria-label="Увеличить количество '+html(p.code)+'">'+icon('plus')+'</button></div><span>'+p.unit+'</span><span class="line-total">'+(sum!==null?money(sum):'Цену уточнить')+'</span></div></div>';
    }).join('');
    listArea.innerHTML=lines+'<div class="totals"><span>'+(complete?'По прайсу':'С известной ценой')+'</span><strong>'+money(total)+'</strong></div><div class="pick-note">Без доставки и накопительной скидки.</div><div class="list-actions"><button type="button" class="btn hot" id="copy-list">'+icon('copy')+'Скопировать список</button><a class="textlink" href="../contacts/?from=list#request">В черновик обращения'+icon('arrow')+'</a><button class="link-button" type="button" id="clear-list">Очистить список</button></div><div id="copy-fallback" hidden><label for="copy-text">Текст для копирования</label><textarea id="copy-text" class="copy-fallback" readonly></textarea></div>';
  }
  function goToLine(id) {
    const input=listArea.querySelector('[data-qty="'+id+'"]');
    if(input){input.focus();input.select();}
  }
  function add(id) {
    if (list.some(x=>x.id===id)) {goToLine(id);return;}
    const p=byId.get(id);
    list.push({id,qty:p.lot||1});
    persist();renderList();renderResults();
    results.querySelector('[data-add="'+id+'"]')?.focus({preventScroll:true});
    status.textContent=p.code+' добавлена в список.';
  }
  results.addEventListener('click',e=>{
    if(e.target.closest('#toggle-nearby')){nearbyOpen=!nearbyOpen;renderResults();el('toggle-nearby').focus({preventScroll:true});return;}
    if(e.target.closest('#reset-query')) return setQuery('',true);
    const button=e.target.closest('[data-add]');if(button)add(button.dataset.add);
  });
  function updateQty(field) {
    const row=list.find(x=>x.id===field.dataset.qty);
    if (!row) return;
    const raw=field.value.trim(),n=Number(raw);
    if (!/^\d+$/.test(raw)||!Number.isSafeInteger(n)||n<1) {
      field.value=row.qty;
      status.textContent='Введите целое количество от 1. Сохранено прежнее значение.';
      return;
    }
    field.value=n;
    if(n===row.qty)return;
    row.qty=n;persist();
    // Keep the live input and neighboring buttons mounted while the user is editing.
    const p=byId.get(row.id),line=lineCents(p,n);
    field.closest('.list-item').querySelector('.line-total').textContent=line===null?'Цену уточнить':money(line);
    const totals=list.map(x=>lineCents(byId.get(x.id),x.qty));
    listArea.querySelector('.totals span').textContent=totals.some(x=>x===null)?'С известной ценой':'По прайсу';
    listArea.querySelector('.totals strong').textContent=money(totals.reduce((s,x)=>s+(x??0),0));
  }
  listArea.addEventListener('change',e=>{if(e.target.matches('[data-qty]'))updateQty(e.target);});
  listArea.addEventListener('keydown',e=>{
    if(e.key==='Enter' && e.target.matches('[data-qty]')){e.preventDefault();updateQty(e.target);e.target.select();}
  });
  async function copy() {
    const text=spec(list),revision=++copyVersion;
    try {
      if(!navigator.clipboard?.writeText)throw Error();
      await navigator.clipboard.writeText(text);
      if(revision===copyVersion)status.textContent='Список скопирован.';
    } catch {
      if(revision!==copyVersion)return;
      const holder=el('copy-fallback'),area=el('copy-text');
      holder.hidden=false;area.value=text;area.focus();area.select();
      let copied=false;try{copied=document.execCommand('copy');}catch{}
      status.textContent=copied?'Список скопирован.':'Текст списка выделен для копирования.';
    }
  }
  listArea.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(button.id==='copy-list')return copy();
    if(button.id==='clear-list') {
      list=[];persist();renderList();renderResults();query.focus();status.textContent='Список очищен.';return;
    }
    const holder=button.closest('[data-line]');if(!holder)return;
    const row=list.find(x=>x.id===holder.dataset.line);
    if(button.hasAttribute('data-remove')){
      const pos=list.indexOf(row);list.splice(pos,1);persist();renderList();renderResults();
      if(list.length)listArea.querySelector('[data-remove="'+list[Math.min(pos,list.length-1)].id+'"]').focus();
      else el('list').focus();
      status.textContent='Позиция удалена.';return;
    }
    if(button.hasAttribute('data-delta')){
      const value=Math.max(1,row.qty+Number(button.dataset.delta));
      if(!Number.isSafeInteger(value))return;
      const field=holder.querySelector('input');field.value=value;updateQty(field);
    }
  });
  query.value=new URL(location.href).searchParams.get('q')||'';
  renderResults();renderList();
  window.addEventListener('pageshow',e=>{if(e.persisted){list=readList();query.value=new URL(location.href).searchParams.get('q')||'';renderResults();renderList();}});
})();
