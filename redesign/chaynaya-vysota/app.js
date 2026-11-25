(() => {
  'use strict';
  const root = document.documentElement;
  const cutoff = Date.parse(root.dataset.meeting);
  const expiry = Date.parse(root.dataset.expiry);
  const refreshPhase = () => {
    const now = Date.now();
    for (const [name, active] of Object.entries({
      'has-date': now < cutoff, 'no-date': now >= cutoff,
      unexpired: now < expiry, expired: now >= expiry
    })) root.classList.toggle(name, active);
    root.classList.remove('no-js');
  };
  refreshPhase();
  // Recheck long-lived tabs, including tabs restored from the back/forward cache.
  function checkCalendar() {
    refreshPhase();
    const next = [cutoff, expiry].find(time => time > Date.now());
    if (next) window.setTimeout(checkCalendar, Math.min(next - Date.now() + 25, 2147480000));
  }
  checkCalendar();
  window.addEventListener('pageshow', refreshPhase);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshPhase(); });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = window.matchMedia('(hover:hover) and (pointer:fine)');
  const getValue = (key) => { try { return sessionStorage.getItem('chaynaya.' + key); } catch { return null; } };
  const setValue = (key, value) => { try { sessionStorage.setItem('chaynaya.' + key, value); } catch {} };
  const variants = new Set(['one', 'two', 'express', 'front', 'table', 'nama', 'six']);
  const isLive = () => Date.now() < cutoff;

  function setupMenu() {
    const button = document.querySelector('#menu-button');
    const menu = document.querySelector('#menu');
    const close = (restoreFocus = false) => {
      menu.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'Открыть меню');
      if (restoreFocus) button.focus();
    };
    button.addEventListener('click', () => {
      if (menu.classList.contains('open')) return close();
      menu.classList.add('open');
      button.setAttribute('aria-expanded','true');
      button.setAttribute('aria-label','Закрыть меню');
      menu.querySelector('a').focus();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('open')) close(true);
    });
    document.addEventListener('pointerdown', e => {
      if (!e.target.closest('.mast')) close();
    });
    menu.addEventListener('click', () => close());
    document.querySelector('.mast').addEventListener('focusout', e => {
      if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) close();
    });
    window.matchMedia('(min-width:821px)').addEventListener('change', () => close());
  }

  function setupSelection() {
    const url = new URL(location.href);
    const params = url.searchParams;
    const ticket = document.querySelector('[data-ticket-page]')?.dataset.ticketPage;
    const rootLink = document.querySelector('.mast .brand').href;
    if (params.get('from') === 'archive' || !isLive()) setValue('meeting', '');
    if (params.get('event') === '67' && isLive()) setValue('meeting', '67');
    if (ticket && variants.has(ticket)) setValue('ticket',ticket);
    const meeting = isLive() && getValue('meeting') === '67';
    const resumeType = getValue('ticket') || 'one';
    const type = variants.has(resumeType) && (resumeType !== 'express' || isLive()) ? resumeType : 'one';
    const target = new URL(type === 'one' ? 'tickets/' : 'tickets/' + type + '/', rootLink);
    if (meeting) target.searchParams.set('event','67');
    document.querySelectorAll('[data-resume]').forEach(link => { link.href = target.href; });
    document.querySelectorAll('[data-choose]').forEach(link => {
      const picked = new URL(target);
      picked.searchParams.set('event','67');
      link.href = picked.href;
    });
    document.querySelectorAll('[data-variant]').forEach(link => {
      const option = new URL(link.href);
      if (meeting) option.searchParams.set('event','67');
      if (params.get('from') === 'archive') option.searchParams.set('from','archive');
      link.href = option.href;
    });
    const selected = document.querySelector('[data-selected-meeting]');
    if (selected) selected.hidden = !meeting;
  }

  function setupMotion() {
    const areas = document.querySelectorAll('.reactive,.mag');
    const clear = node => {
      for (const k of ['--mx','--my','--shiftX','--shiftY']) node.style.removeProperty(k);
    };
    areas.forEach(node => {
      node.addEventListener('pointermove', e => {
        if (motion.matches || !mouse.matches || e.pointerType === 'touch') return;
        const box = node.getBoundingClientRect();
        const rx = (e.clientX - box.left) / box.width - .5;
        const ry = (e.clientY - box.top) / box.height - .5;
        const magnetic = node.classList.contains('mag');
        node.style.setProperty(magnetic ? '--mx' : '--shiftX',(rx * (magnetic ? 8 : 6)).toFixed(2)+'px');
        node.style.setProperty(magnetic ? '--my' : '--shiftY',(ry * (magnetic ? 7 : 4)).toFixed(2)+'px');
      }, {passive:true});
      node.addEventListener('pointerleave', () => clear(node));
    });
    const poster = document.querySelector('.poster');
    const liquid = poster?.querySelector('.liquid');
    let queued = false;
    function paint() {
      queued = false;
      if (!liquid) return;
      const box = poster.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - box.top) / (innerHeight + box.height * .3)));
      const y = motion.matches ? 212 : 268 - progress * 79;
      liquid.setAttribute('transform','translate(0 '+y.toFixed(2)+')');
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    if (liquid) {
      paint();
      window.addEventListener('scroll', queue, {passive:true});
      window.addEventListener('resize', queue, {passive:true});
    }
    motion.addEventListener('change', () => { areas.forEach(clear); paint(); });
  }

  function setupPicker() {
    document.querySelectorAll('[data-picker]').forEach(picker => {
      const teas = JSON.parse(picker.dataset.picker);
      const buttons = [...picker.querySelectorAll('[data-taste]')];
      const result = picker.querySelector('.pick-result');
      const picture = picker.querySelector('.pick-photo img');
      const original = {src:picture.getAttribute('src'),alt:picture.alt};
      const select = index => {
        const tea = teas[index];
        buttons.forEach((b,i) => b.setAttribute('aria-pressed',String(i===index)));
        result.hidden = false;
        result.querySelector('h3').textContent = tea.name;
        result.querySelector('.result-desc').textContent = tea.desc;
        result.querySelector('.result-link').href = tea.url;
        picture.src = tea.img;
        picture.alt = tea.alt;
        if (window.matchMedia('(max-width:620px)').matches) {
          result.querySelector('h3').setAttribute('tabindex','-1');
          result.querySelector('h3').focus({preventScroll:true});
          result.scrollIntoView({block:'nearest'});
        }
      };
      const reset = () => {
        result.hidden = true;
        buttons.forEach(b => b.setAttribute('aria-pressed','false'));
        picture.src = original.src;
        picture.alt = original.alt;
        buttons[0].focus();
      };
      buttons.forEach((b,i) => b.addEventListener('click', () => select(i)));
      picker.querySelector('[data-again]').addEventListener('click',reset);
      picker.addEventListener('keydown', e => { if (e.key === 'Escape' && !result.hidden) reset(); });
    });
  }

  function setupMaps() {
    const map = document.querySelector('[data-map-switch]');
    if (!map) return;
    const choices = [...document.querySelectorAll('[data-map-id]')];
    choices.forEach(button => button.addEventListener('click', () => {
      choices.forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      map.src = button.dataset.frame;
      map.title = 'Яндекс Карта · '+button.textContent;
      document.querySelector('[data-map-route]').href = button.dataset.route;
      document.querySelector('[data-map-route] span').textContent = 'Маршрут '+button.dataset.label;
    }));
  }

  function setupForm() {
    const form = document.querySelector('#request-form');
    if (!form) return;
    const result = document.querySelector('#draft');
    const output = result.querySelector('textarea');
    const contact = result.querySelector('[data-open-draft]');
    const type = getValue('ticket');
    if (variants.has(type) && type !== 'express') form.elements.ticket.value=type;
    if (isLive() && getValue('meeting')==='67') form.elements.program.value='№ 67, 26 ноября, 20:00';
    const updateLink = () => {
      const url = new URL(contact.dataset.base);
      url.searchParams.set('text',output.value);
      contact.href = url.href;
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const program = form.elements.program;
      program.setCustomValidity(program.value.trim() ? '' : 'Укажите встречу или попросите сообщить следующую дату.');
      if (!form.reportValidity()) return;
      const label = form.elements.ticket.selectedOptions[0].textContent;
      output.value = 'Здравствуйте! Хочу согласовать посещение в чайной на Тверской. Билет: '+label+'. Встреча: '+program.value.trim()+'.';
      result.hidden = false;
      result.querySelector('[role="status"]').textContent='Текст готов. Его можно отредактировать.';
      updateLink();
      output.focus();
    });
    form.elements.program.addEventListener('input', () => form.elements.program.setCustomValidity(''));
    form.addEventListener('input', () => { result.hidden=true; });
    output.addEventListener('input',updateLink);
    result.querySelector('[data-copy]').addEventListener('click', async () => {
      let copied=false;
      try { await navigator.clipboard.writeText(output.value); copied=true; }
      catch { output.focus(); output.select(); try { copied=document.execCommand('copy'); } catch {} }
      result.querySelector('[role="status"]').textContent=copied?'Текст скопирован.':'Текст выделен для копирования.';
    });
    result.querySelector('[data-new-draft]').addEventListener('click', () => {
      result.hidden=true; form.elements.program.focus();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupMenu(); setupSelection(); setupMotion(); setupPicker(); setupMaps(); setupForm();
  });
})();
