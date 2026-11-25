'use strict';

(() => {
  const byId = id => document.getElementById(id);
  const form = byId('spec-form'), contact = byId('contact-form'), dialog = byId('binding-dialog');
  const options = [...dialog.querySelectorAll('[data-binding]')];
  const formats = {a5:[148,210,1,'А5'], a4:[210,297,1.2,'А4'], a3:[297,420,3,'А3']};
  // Basic portrait cover from the published calculator. Embossing, bands, printing
  // and block assembly are outside this estimate.
  const rates = {soft:.7,'7bc':1,'7b':.7,cloth:1,leather:2};
  const quantityFactors = {1:1,2:.9,3:.85,5:.8,10:.7,30:.6,50:.5,80:.45,100:.4,200:.35};
  const pageBands = [3500,4000,4500,4800,5250,6000,7000,7600,8100,8500];
  const swatches = {'7b':'#5b6371','7bc':'#834331',soft:'#bd865a',cloth:'#49604a',leather:'#723c32',french:'#633e32',kbs:'#98674e',kshs:'#526044',integral:'#535d72'};
  const serviceMessages = {repair:'Ремонт или реставрация книги. ',docs:'Переплёт документов. ',brochure:'Брошюровка. ',diploma:'Переплёт диплома или диссертации. '};
  const number = new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
  const money = n => number.format(n) + ' ₽';
  const controls = {format:byId('format-first'),binding:byId('binding-trigger')};
  let selected = '', generated = '', attached = '';
  function optionFor(value) { return options.find(el => el.dataset.binding === value); }
  function bindingTitle() { return optionFor(selected)?.querySelector('strong').textContent ?? ''; }
  function currentFormat() { return form.querySelector('input[name="format"]:checked')?.value || ''; }
  function whole(id) {
    const raw = byId(id).value.trim();
    if (!/^\d+$/.test(raw)) return 0;
    const value = Number(raw);
    return value > 0 && Number.isSafeInteger(value) ? value : 0;
  }
  function millimetres(id) {
    const raw = byId(id).value.trim();
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) return 0;
    const value = Number(raw.replace(',','.'));
    return Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER ? value : 0;
  }
  function formatLabel() {
    const key = currentFormat(), entry = formats[key];
    if (entry) return entry[3] + ' · ' + entry[0] + ' × ' + entry[1] + ' мм';
    if (key === 'custom' && millimetres('width') && millimetres('height')) {
      return byId('width').value.trim().replace('.',',') + ' × ' + byId('height').value.trim().replace('.',',') + ' мм';
    }
    return '';
  }
  function focusAt(el, align = el) {
    el.focus({preventScroll:true});
    align.scrollIntoView({block:'start',behavior:'instant'});
  }
  function showError(key, text) {
    const el = controls[key] || byId(key), note = byId(key+'-error');
    note.textContent = text; note.hidden = !text;
    if (text) el.setAttribute('aria-invalid','true'); else el.removeAttribute('aria-invalid');
    if (key === 'format') {
      const group = el.closest('fieldset');
      group.setAttribute('aria-invalid',String(!!text));
      el.setAttribute('aria-describedby','format-error');
    }
  }
  function readParameters() {
    const format = currentFormat(), pages = whole('pages'), copies = whole('copies');
    const errors = {};
    if (!format) errors.format = 'Выберите формат готовой книги.';
    if (format === 'custom') {
      if (!millimetres('width')) errors.width = 'Укажите положительную ширину в миллиметрах.';
      if (!millimetres('height')) errors.height = 'Укажите положительную высоту в миллиметрах.';
    }
    if (!pages) errors.pages = 'Введите целое число страниц от 1.';
    if (selected === 'kshs' && pages && pages < 32) errors.pages = 'Для КШС мастерская указывает объём от 32 страниц. Измените объём или переплёт.';
    if (!copies) errors.copies = 'Введите целое число экземпляров от 1.';
    if (!selected) errors.binding = 'Выберите вид переплёта.';
    return {format,pages,copies,errors};
  }
  function priceFor({format,pages,copies}) {
    if (!formats[format] || !rates[selected] || !quantityFactors[copies] || pages > 1000) return null;
    const base = pageBands[Math.ceil(pages / 100) - 1];
    if (!base) return null;
    const unit = Math.round(base * formats[format][2] * rates[selected] * quantityFactors[copies] * 100) / 100;
    return {unit,lot:Math.round(unit * copies * 100) / 100};
  }
  function priceLabel(data) {
    const price = priceFor(data);
    return price ? money(price.unit)+' за обложку · '+money(price.lot)+' за тираж.' : 'Индивидуальная оценка мастерской. Для этого сочетания в демо нет ставки.';
  }
  function renderPreview() {
    const data = readParameters();
    byId('custom-size').hidden = data.format !== 'custom';
    const label = [formatLabel(),data.pages ? data.pages + ' стр.' : '',data.copies ? data.copies + ' экз.' : ''].filter(Boolean).join(' · ');
    byId('preview-line').textContent = label || 'Формат и тираж пока не выбраны';
    const proof = document.querySelector('.proof');
    const dimensions = formats[data.format]?.slice(0,2) || [millimetres('width'),millimetres('height')];
    proof.style.setProperty('--mini-w', dimensions.every(Boolean) ? Math.max(38,Math.min(124,100 * dimensions[0]/dimensions[1])) + 'px' : '78px');
    proof.style.setProperty('--thickness',Math.min(17,3+Math.round(data.pages/70))+'px');
    proof.style.setProperty('--swatch',swatches[selected] || '#8c4f37');
    byId('estimate-text').textContent = Object.keys(data.errors).length ? 'Укажите все параметры, чтобы проверить стоимость.' : priceLabel(data);
    byId('bind-note').hidden = !selected;
    byId('bind-note').textContent = optionFor(selected)?.querySelector('small').textContent || '';
  }
  function detachSpec() {
    attached = ''; byId('attached-spec').hidden = true; byId('attached-text').textContent = '';
    byId('message-label').textContent = 'Описание заказа';
    byId('message').setAttribute('aria-required','true');
  }
  function revised() {
    generated = ''; byId('result').hidden = true; byId('spec-text').value = ''; byId('copy-status').textContent = '';
    if (attached) detachSpec();
    byId('success').hidden = true; contact.hidden = false;
    const currentErrors = readParameters().errors;
    for (const key of ['format','pages','copies','width','height','binding']) {
      if (!byId(key+'-error').hidden) showError(key,currentErrors[key] || '');
    }
    renderPreview();
  }
  function choose(value) {
    selected = optionFor(value) ? value : '';
    byId('binding-value').textContent = bindingTitle() || 'Выберите переплёт';
    for (const opt of options) opt.setAttribute('aria-pressed',String(opt.dataset.binding === selected));
    revised();
  }
  const trigger = byId('binding-trigger');
  trigger.addEventListener('click', () => {
    dialog.showModal(); trigger.setAttribute('aria-expanded','true');
    const target = optionFor(selected) || options[0];
    target.focus({preventScroll:true}); target.scrollIntoView({block:'nearest'});
  });
  byId('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => trigger.setAttribute('aria-expanded','false'));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
  });
  for (const opt of options) opt.addEventListener('click', () => {
    if (selected !== opt.dataset.binding) choose(opt.dataset.binding);
    dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    const i = options.indexOf(document.activeElement);
    if (i < 0) return;
    const index = {ArrowDown:Math.min(options.length-1,i+1),ArrowUp:Math.max(0,i-1),Home:0,End:options.length-1}[event.key];
    if (index !== undefined) {event.preventDefault();options[index].focus();}
  });
  form.addEventListener('input', revised);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = readParameters();
    for (const key of ['format','width','height','pages','copies','binding']) showError(key,data.errors[key] || '');
    const first = Object.keys(data.errors)[0];
    if (first) return focusAt(controls[first] || byId(first));
    const lines = ['Формат готовой книги — '+formatLabel()+'.','Объём — '+data.pages+' стр. Тираж — '+data.copies+' экз.','Переплёт — '+bindingTitle()+'.','Стоимость обложек — '+priceLabel(data)];
    if (priceFor(data)) lines.push('Книжная ориентация, офсет 80 г/м², без тиснения и бинтов. Печать и сборка блока оплачиваются отдельно.');
    generated = lines.join('\n'); byId('spec-text').value = generated;
    byId('result').hidden = false; byId('copy-status').textContent = '';
    focusAt(byId('result-title'),byId('result'));
  });
  byId('edit-spec').addEventListener('click', () => focusAt(form.querySelector('input[name="format"]:checked') || byId('format-first'),byId('parameters')));
  byId('back-to-spec').addEventListener('click', () => byId('edit-spec').click());
  byId('copy-spec').addEventListener('click', async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      byId('copy-status').textContent = 'Спецификация скопирована.';
    } catch {
      byId('spec-text').focus(); byId('spec-text').select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      byId('copy-status').textContent = copied ? 'Спецификация скопирована.' : 'Текст выделен. Скопируйте его через меню браузера.';
    }
  });
  byId('transfer').addEventListener('click', () => {
    if (!generated) return;
    attached = generated;
    byId('attached-text').textContent = attached; byId('attached-spec').hidden = false;
    byId('message-label').textContent = 'Пожелания к заказу · по желанию';byId('message').removeAttribute('aria-required');showError('message','');
    byId('success').hidden = true;contact.hidden = false;focusAt(byId('email'));
  });
  function clearSpec() {
    form.reset();choose('');detachSpec();
    for (const key of ['format','width','height','pages','copies','binding']) showError(key,'');
    renderPreview();
  }
  byId('clear-spec').addEventListener('click',() => {clearSpec();focusAt(byId('format-first'),byId('parameters'));});
  function validateContact() {
    const email = byId('email');
    const errors = {};
    if (!email.value.trim() || email.validity.typeMismatch) errors.email = 'Введите электронную почту для ответа.';
    if (!attached && !byId('message').value.trim()) errors.message = 'Опишите книгу или добавьте собранную спецификацию.';
    if ([...byId('files').files].some(file => !/\.(pdf|jpe?g|png)$/i.test(file.name))) errors.files = 'Выберите PDF, JPG или PNG для демонстрации.';
    return errors;
  }
  contact.addEventListener('input', () => {
    const errors = validateContact();
    for (const key of ['email','message','files']) if (!byId(key+'-error').hidden) showError(key,errors[key] || '');
  });
  byId('files').addEventListener('change', () => {
    byId('remove-files').hidden = !byId('files').files.length;
    byId('file-status').textContent = [...byId('files').files].map(f => f.name).join(', ') || 'Файлы не выбраны';
    showError('files',validateContact().files || '');
  });
  byId('remove-files').addEventListener('click', () => {
    byId('files').value = ''; byId('file-status').textContent = 'Файлы не выбраны'; byId('remove-files').hidden = true;showError('files','');byId('files').focus();
  });
  contact.addEventListener('submit', event => {
    event.preventDefault();
    const errors = validateContact();
    for (const key of ['email','message','files']) showError(key,errors[key] || '');
    const first = Object.keys(errors)[0]; if (first) return focusAt(byId(first));
    const count = byId('files').files.length;
    byId('success-info').textContent = (attached ? 'Спецификация и адрес заполнены.' : 'Описание и адрес заполнены.') + (count ? ' Выбрано файлов — '+count+'.' : '');
    contact.hidden = true; byId('success').hidden = false;focusAt(byId('success-title'));
  });
  byId('correct').addEventListener('click', () => {byId('success').hidden = true; contact.hidden = false; focusAt(byId('email'));});
  byId('restart').addEventListener('click', () => {
    contact.reset();byId('file-status').textContent='Файлы не выбраны';byId('remove-files').hidden = true;byId('success-info').textContent = '';
    for (const key of ['email','message','files']) showError(key,'');
    clearSpec();focusAt(byId('format-first'),byId('parameters'));
  });
  detachSpec();
  const query = new URLSearchParams(location.search);
  const service = query.get('service');
  if (Object.hasOwn(serviceMessages,service)) byId('message').value = serviceMessages[service];
  choose(query.get('binding') || '');
})();
