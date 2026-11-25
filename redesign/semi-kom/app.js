(() => {
  'use strict';
  const $ = (selector, from = document) => from.querySelector(selector);
  const all = (selector, from = document) => Array.from(from.querySelectorAll(selector));
  const items = JSON.parse($('#catalog-data').textContent);
  const byCode = new Map(items.map(item => [item.code, item]));
  const storageKey = 'semicom-demo-parts-v1';
  const page = document.body.dataset.page;
  const formatter = new Intl.NumberFormat('ru-RU');
  const format = number => formatter.format(number);
  const cash = number => format(number) + ' ₽';
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const valid = value => /^\d+$/.test(value) && /[1-9]/.test(value);
  const glyph = (type) => type === 'trash'
    ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16M9 6V3.5h6V6m-10 1 1 13h12l1-13M10 10v7m4-7v7"/></svg>'
    : '';
  let cart = {};
  function readCart() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      cart = Object.fromEntries(Object.entries(saved || {}).filter(([key, value]) =>
        byCode.has(key) && typeof value === 'string' && valid(value)));
    } catch { /* The current page remains usable when storage is unavailable. */ }
  }
  function count() {
    const length = Object.keys(cart).length;
    all('[data-count]').forEach(node => { node.textContent = length; });
    $('.bag-link').setAttribute('aria-label', 'Список покупки, позиций ' + length);
  }
  function save() {
    try {
      if (Object.keys(cart).length) sessionStorage.setItem(storageKey, JSON.stringify(cart));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Keep the in-memory list available in this document. */ }
    count();
  }
  readCart(); count();

  // The navigation disclosure shares the fixed header's available viewport height.
  const menuButton = $('.hamb');
  const menu = $('#mobile-nav');
  function toggleMenu(open, restoreFocus = false) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => toggleMenu(menu.hidden));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!menu.hidden) toggleMenu(false, true);
    const disclosure = event.target.closest('details[open]');
    if (disclosure) { disclosure.open = false; $('summary',disclosure).focus(); }
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && ((!menu.contains(event.target) && !menuButton.contains(event.target)) || event.target.closest('#mobile-nav a'))) toggleMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) toggleMenu(false);
    const field = event.target;
    if (field.closest('.topbar,.skip')) return;
    requestAnimationFrame(() => {
      if (document.activeElement !== field) return;
      const top = field.getBoundingClientRect().top;
      const headerBottom = $('.topbar').getBoundingClientRect().bottom;
      if (top < headerBottom + 5) window.scrollBy(0, top - headerBottom - 9);
    });
  });
  matchMedia('(min-width:761px)').addEventListener('change', event => {
    if (event.matches) toggleMenu(false);
  });

  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const magnet = $('.magnet');
  function resetMagnet() {
    magnet.style.removeProperty('--mx'); magnet.style.removeProperty('--my');
  }
  magnet.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType === 'touch') return;
    const rect = magnet.getBoundingClientRect();
    magnet.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 7 - 3.5) + 'px');
    magnet.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 5 - 2.5) + 'px');
  });
  magnet.addEventListener('pointerleave', resetMagnet);
  const hero = $('.hero'), board = $('#moving-board'), chip = $('#chip-package'), shadow = $('.ground-shadow');
  const heroStage = $('.hero-stage');
  const decorations = all('[data-scroll-art]').map(element => ({
    element, a:$('.detail-a', element), b:$('.detail-b', element), photo:$('img', element)
  }));
  const cap = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  let px = 0, py = 0, pending = false;
  function paint() {
    pending = false;
    const height = window.innerHeight;
    if (hero) {
      const p = reduced.matches ? 0 : cap(window.scrollY / Math.max(170, hero.offsetHeight * .68), 0, 1);
      board.style.transform = 'translate(' + (px*18 + p*6).toFixed(2) + 'px,' + (py*10-p*8).toFixed(2) + 'px) rotate(' + (px*3.8-p*2.5).toFixed(2) + 'deg)';
      chip.style.transform = 'translate(' + (px*9).toFixed(2) + 'px,' + (py*5+p*37).toFixed(2) + 'px)';
      shadow.style.transform = 'scale(' + (1 - .08*p).toFixed(3) + ',1)';
    }
    for (const {element,a,b,photo} of decorations) {
      const rect = element.getBoundingClientRect();
      const p = reduced.matches ? .5 : cap((height - rect.top) / (height + rect.height), 0, 1);
      const offset = .5 - p;
      if (a) a.style.transform = 'translate(' + (offset*57).toFixed(2) + 'px,' + (-offset*17).toFixed(2) + 'px)';
      if (b) b.style.transform = 'translate(' + (-offset*32).toFixed(2) + 'px,' + (offset*10).toFixed(2) + 'px)';
      if (photo) photo.style.transform = 'scale(1.06) translateY(' + (offset*5).toFixed(3) + '%)';
    }
  }
  function queuePaint() {
    if (!pending) { pending = true; requestAnimationFrame(paint); }
  }
  if (hero) {
    const point = event => {
      if (reduced.matches) return;
      const rect = heroStage.getBoundingClientRect();
      px = cap(((event.clientX-rect.left)/rect.width-.5)*2,-1,1);
      py = cap(((event.clientY-rect.top)/rect.height-.5)*2,-1,1);
      queuePaint();
    };
    hero.addEventListener('pointermove', event => {
      if (fine.matches && event.pointerType !== 'touch') point(event);
    }, {passive:true});
    const reset = () => { px=0; py=0; queuePaint(); };
    hero.addEventListener('pointerleave', reset);
    heroStage.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') point(event); }, {passive:true});
    heroStage.addEventListener('pointercancel', reset);
    heroStage.addEventListener('pointerup', event => { if (event.pointerType === 'touch') reset(); });
  }
  window.addEventListener('scroll', queuePaint, {passive:true});
  window.addEventListener('resize', queuePaint, {passive:true});
  reduced.addEventListener('change', () => { px=0; py=0; resetMagnet(); queuePaint(); });
  document.addEventListener('toggle', queuePaint, true);
  queuePaint();

  function setError(input, id, message) {
    const hint = document.getElementById(id);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    hint.hidden = !message;
    hint.textContent = message;
  }
  function revealField(input) {
    input.focus({preventScroll:true});
    input.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  }
  const quantityError='Введите целое количество больше нуля.';
  function totals() {
    let amount = 0n, pendingPrice = 0, priced = 0;
    for (const [key, quantity] of Object.entries(cart)) {
      const item = byCode.get(key);
      if (item.price === null) pendingPrice++;
      else { amount += BigInt(item.price)*BigInt(quantity); priced++; }
    }
    return {amount, pendingPrice, priced};
  }

  if (page === 'catalog') {
    const field = $('#search'), clear = $('#clear-search');
    const filters = all('[data-filter]'), products = all('[data-product]');
    const params = new URLSearchParams(location.search);
    let group = filters.some(button => button.dataset.filter === params.get('group')) ? params.get('group') : 'all';
    field.value = params.get('q') || '';
    let toastTimer;
    function filter() {
      const terms = normalize(field.value.trim()).split(/\s+/).filter(Boolean);
      let found = 0;
      products.forEach(row => {
        const item = byCode.get(row.dataset.product);
        const searchable = normalize([item.code === 'cord' ? '' : item.code, item.name, item.raw, item.spec, item.pack].join(' '));
        row.hidden = (group !== 'all' && item.group !== group) || !terms.every(term => searchable.includes(term));
        if (!row.hidden) found++;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(group === button.dataset.filter)));
      clear.hidden = !field.value;
      $('.no-results').hidden = found !== 0;
      $('#found').textContent = 'Найдено позиций: ' + found;
    }
    function syncQuery() {
      const url = new URL(location.href);
      if (group === 'all') url.searchParams.delete('group'); else url.searchParams.set('group',group);
      if (field.value.trim()) url.searchParams.set('q',field.value.trim()); else url.searchParams.delete('q');
      history.replaceState(null,'',url.pathname + url.search + url.hash);
      filter();
    }
    filters.forEach(button => button.addEventListener('click', () => { group=button.dataset.filter; syncQuery(); }));
    field.addEventListener('input',syncQuery);
    clear.addEventListener('click',()=>{field.value='';syncQuery();field.focus();});
    $('#reset-filters').addEventListener('click',()=>{group='all';field.value='';syncQuery();field.focus();});
    for (const row of products) {
      const form = $('.add-form',row), input = $('.quantity',form), code = row.dataset.product;
      input.addEventListener('input',()=>setError(input,'err-'+code,''));
      form.addEventListener('submit', event => {
        event.preventDefault();
        const value=input.value.trim();
        if (!valid(value)) {setError(input,'err-'+code,quantityError); revealField(input);return;}
        setError(input,'err-'+code,'');
        cart[code] = String(BigInt(cart[code] || 0) + BigInt(value));
        save();
        const toast = $('.add-toast');
        $('span',toast).textContent = byCode.get(code).name + ' в списке · ' + format(BigInt(cart[code])) + ' ' + byCode.get(code).unit;
        toast.hidden=false;clearTimeout(toastTimer);
        toastTimer=setTimeout(()=>{if(!toast.contains(document.activeElement)) toast.hidden=true;},4500);
      });
    }
    filter();
  }

  function updateCartTotal() {
    const {amount,pendingPrice,priced} = totals();
    $('#total-label').textContent = pendingPrice && priced ? 'По позициям с ценой' : 'По каталогу';
    $('#cart-total').textContent = priced ? cash(amount) : 'По запросу';
    $('#total-explanation').textContent = pendingPrice ? 'Для шнура магазин отдельно подтвердит цену.' : 'Количество каждой позиции умножено на цену за штуку или упаковку.';
  }
  function updateLine(row,item) {
    const qty=BigInt(cart[item.code]);
    $('.row-money',row).textContent=item.price===null?'Цена по запросу':cash(qty*BigInt(item.price));
    if (item.unit==='уп.') $('.allocation',row).textContent='В упаковке 50 шт. Всего ' + format(qty*50n) + ' шт.';
  }
  function renderList() {
    const ids=Object.keys(cart);
    $('#empty-list').hidden=ids.length>0;$('#filled-list').hidden=ids.length===0;
    const lines=$('#lines');lines.replaceChildren();
    for(const code of ids) {
      const item=byCode.get(code);
      const row=document.createElement('article');row.className='cart-row';row.dataset.line=code;
      row.innerHTML='<div><p class="item-code"></p><h3></h3><p class="allocation"></p><p class="calc"></p><p class="row-money"></p></div><div><label class="field-small" for="line-'+code+'">Кол-во, '+item.unit+'</label><input class="quantity" type="text" inputmode="numeric" pattern="[0-9]+" id="line-'+code+'" aria-describedby="line-err-'+code+'" autocomplete="off"><small class="error" id="line-err-'+code+'" hidden></small></div><button type="button" class="remove">'+glyph('trash')+'</button>';
      $('.item-code',row).textContent=code==='cord'?'Изготовление на заказ':'Арт. '+code;
      $('h3',row).textContent=item.name;
      $('.allocation',row).textContent=item.unit==='шт.' && item.pack==='Поштучно' ? 'Продажа поштучно' : item.pack;
      $('.calc',row).textContent=item.price===null?'Стоимость согласует магазин':cash(BigInt(item.price))+' / '+item.unit;
      const input=$('input',row);
      input.value=cart[code];
      input.setAttribute('aria-label','Количество — '+item.name+', '+item.unit);
      const remove=$('.remove',row);remove.setAttribute('aria-label','Удалить — '+item.name);
      remove.addEventListener('click',()=>{
        const index=Object.keys(cart).indexOf(code);delete cart[code];save();renderList();
        const rows=all('.cart-row');
        (rows.length ? $('.quantity',rows[Math.min(index,rows.length-1)]) : $('#empty-list a')).focus();
        $('#cart-status').textContent='Позиция удалена.';
      });
      input.addEventListener('input',()=>{
        const ok=valid(input.value.trim());
        setError(input,'line-err-'+code,ok?'':quantityError);
        if (!ok) return;
        cart[code]=String(BigInt(input.value.trim()));save();updateLine(row,item);updateCartTotal();
      });
      input.addEventListener('keydown',event=>{if(event.key==='Enter' && valid(input.value.trim())){input.value=cart[code];$('#cart-status').textContent='Количество обновлено.';}});
      updateLine(row,item);lines.append(row);
    }
    if(ids.length) updateCartTotal();
  }
  if(page==='list') {
    renderList();
    $('#clear-cart').addEventListener('click',()=>{cart={};save();renderList();$('#empty-list a').focus();});
    $('.proceed').addEventListener('click',event=>{
      const invalid=$('.cart-row input[aria-invalid=true]');
      if(invalid){event.preventDefault();revealField(invalid);}
    });
  }

  function renderSummary() {
    const el=$('#summary');el.replaceChildren();
    const keys=Object.keys(cart);
    const p=document.createElement('p');
    if(!keys.length){p.textContent='Пока пуст. Можно задать вопрос магазину.';el.append(p);return;}
    const list=document.createElement('ul');
    for(const key of keys) {
      const item=byCode.get(key), line=document.createElement('li');
      line.textContent=(key==='cord'?'':'Арт. '+key+' · ')+item.name+' — '+format(BigInt(cart[key]))+' '+item.unit;
      list.append(line);
    }
    const {amount,priced,pendingPrice}=totals();
    p.textContent=(priced?'По каталогу '+cash(amount):'Цена по запросу')+(pendingPrice && priced?' + шнур по запросу':'');
    el.append(list,p);
  }
  if(page==='contacts') {
    const form=$('#request-form'), success=$('#request-success'), city=$('#city'), name=$('#your-name'), reply=$('#reply-to');
    function receipt(){return $('input[name=receipt]:checked',form).value;}
    function delivery(){
      const show=receipt()==='Доставка';$('.delivery-destination').hidden=!show;city.required=show;
      if(!show)setError(city,'city-error','');
    }
    function validate(input){
      const value=input.value.trim();
      if(input===name) return value?'':'Укажите имя или название организации.';
      if(input===city) return !city.required || value?'':'Укажите город доставки.';
      const eMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const digits=value.replace(/\D/g,'');
      const phone=/^\+?[\d\s()\-]+$/.test(value) && digits.length>=7 && digits.length<=15;
      return eMail || phone?'':'Укажите телефон с кодом или почту, например name@example.ru.';
    }
    all('input[name=receipt]',form).forEach(input=>input.addEventListener('change',delivery));
    for(const input of [name,reply,city])input.addEventListener('input',()=>{
      if(input.getAttribute('aria-invalid')==='true') setError(input,input.id+'-error',validate(input));
    });
    form.addEventListener('submit',event=>{
      event.preventDefault();let first=null;
      for(const input of [city,name,reply]){
        const message=validate(input);setError(input,input.id+'-error',message);if(message && !first) first=input;
      }
      if(first){revealField(first);return;}
      const summary=[receipt()+(city.required?' в г. '+city.value.trim():''), 'Контакт: '+name.value.trim()+' · '+reply.value.trim()];
      if($('#message').value.trim()) summary.push($('#message').value.trim());
      $('#success-details').textContent=summary.join('. ');
      form.hidden=true;success.hidden=false;success.focus();
    });
    $('#edit-request').addEventListener('click',()=>{success.hidden=true;form.hidden=false;name.focus();});
    $('#new-request').addEventListener('click',()=>{
      form.reset();cart={};save();renderSummary();delivery();$('#success-details').textContent='';
      [name,reply,city].forEach(input=>setError(input,input.id+'-error',''));
      success.hidden=true;form.hidden=false;name.focus();
    });
    renderSummary();delivery();
  }
  window.addEventListener('pageshow',event=>{
    if(event.persisted){
      readCart();count();
      if(page==='list')renderList();
      if(page==='contacts')renderSummary();
    }
    queuePaint();
  });
})();
