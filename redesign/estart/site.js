(() => {
  'use strict';
  const mast=document.querySelector('.mast');
  const menu=document.querySelector('#mobile-nav');
  const toggle=document.querySelector('.menu-toggle');
  function closeMenu(restore=false) {
    menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');
    if(restore) toggle.focus({preventScroll:true});
  }
  toggle.addEventListener('click',()=>{
    if(!menu.hidden){closeMenu();return;}
    menu.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть меню');
  });
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!mast.contains(e.target))closeMenu();});
  menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden)closeMenu(true);});
  mast.addEventListener('focusout',e=>{if(!menu.hidden&&e.relatedTarget&&!mast.contains(e.relatedTarget))closeMenu();});
  matchMedia('(min-width:701px)').addEventListener('change',()=>closeMenu());
  addEventListener('pagehide',()=>closeMenu()); addEventListener('pageshow',()=>closeMenu());
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const contact=document.querySelector('.contact');
  function rest(){contact.style.removeProperty('--mx');contact.style.removeProperty('--my');}
  contact.addEventListener('pointermove',e=>{
    if(reduced.matches||!fine.matches||e.pointerType==='touch')return;
    const r=contact.getBoundingClientRect();
    contact.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*7+'px');
    contact.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*5+'px');
  },{passive:true});
  contact.addEventListener('pointerleave',rest); contact.addEventListener('blur',rest);
  const scenes=[...document.querySelectorAll('[data-scroll]')];
  let pending=false;
  function update(){
    pending=false;
    for(const scene of scenes){
      const box=scene.getBoundingClientRect();
      const p=reduced.matches?.5:Math.max(0,Math.min(1,(innerHeight-box.top)/(innerHeight+box.height*.88)));
      const value=p.toFixed(4);
      if(scene.style.getPropertyValue('--phase')!==value)scene.style.setProperty('--phase',value);
    }
  }
  function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  reduced.addEventListener('change',()=>{rest();queue();});
  new ResizeObserver(queue).observe(document.body);
  update();

  document.addEventListener('focusin',e=>{
    const target=e.target;
    if(mast.contains(target)||target.closest('dialog')||target.classList.contains('skip'))return;
    requestAnimationFrame(()=>{
      if(document.activeElement!==target)return;
      const b=target.getBoundingClientRect(),top=mast.getBoundingClientRect().bottom+8;
      if(b.height>0&&b.top<top)window.scrollBy(0,b.top-top);
    });
  });

  const find=document.querySelector('#find');
  if(!find) return;
  const dirs=[...document.querySelectorAll('#directory .dir')];
  const clear=document.querySelector('.clear-find'),status=document.querySelector('#search-status');
  let opened=null;
  const norm=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
  function search(){
    const query=norm(find.value);
    if(query&&!opened)opened=[...document.querySelectorAll('#directory details[open]')];
    let count=0;
    for(const dir of dirs){
      const rootMatches=norm(dir.querySelector('summary').textContent).includes(query);
      let any=false;
      for(const row of dir.querySelectorAll('li')){
        const show=!query||rootMatches||norm(row.dataset.search||row.textContent).includes(query);
        row.hidden=!show;if(show)any=true;
      }
      for(const branch of dir.querySelectorAll('.subdir')){
        const hasMatch=!!branch.querySelector('li:not([hidden])');
        branch.hidden=!!query&&!hasMatch;
        if(query)branch.open=!rootMatches&&hasMatch;
        else if(opened)branch.open=opened.includes(branch);
      }
      dir.hidden=!!query&&!rootMatches&&!any;
      if(!dir.hidden)count++;
      if(query)dir.open=!dir.hidden;
      else if(opened)dir.open=opened.includes(dir);
    }
    if(!query)opened=null;
    clear.hidden=!query;
    status.textContent=query?(count?'Подходящих разделов: '+count:'Категория не найдена. Попробуйте название ткани, бренда или направления.'):'';
  }
  find.addEventListener('input',search);clear.addEventListener('click',()=>{find.value='';search();find.focus();});
})();
