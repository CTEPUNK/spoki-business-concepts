'use strict';
(() => {
  const materials = JSON.parse(document.querySelector('#materials-data').textContent);
  const defaults = Object.freeze({w:24, h:25, left:4, right:4, top:4, bottom:5, profile:'sea', mat:'sand', fit:'contain'});
  const artwork = 'assets/citrons.a7fe5ca1d069.svg';
  const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const marks = new Map();
  function attrs(node, values) {
    for (const [key, value] of Object.entries(values)) node.setAttribute(key, value);
  }
  function rectangle(x, y, w, h) { return 'M'+x+' '+y+'h'+w+'v'+h+'h-'+w+'Z'; }
  function geometry(svg, state, imageURL = artwork, sourceSize = {w:360,h:365}) {
    if (!svg) return;
    const profile = materials.profiles.find(item => item.id === state.profile);
    const mat = materials.mats.find(item => item.id === state.mat);
    const left = mat ? state.left : 0, right = mat ? state.right : 0;
    const top = mat ? state.top : 0, bottom = mat ? state.bottom : 0;
    const cm = profile.width / 10;
    const totalW = state.w + left + right + cm * 2;
    const totalH = state.h + top + bottom + cm * 2;
    const model = svg.dataset.frame;
    const layerScene = model === 'layers';
    const scale = Math.min((layerScene ? 266 : 429) / totalW, (layerScene ? 278 : 358) / totalH);
    const W = scale * totalW, H = scale * totalH, face = cm * scale;
    const x = (500 - W)/2, y = (430 - H)/2;
    const wx = x + face + left*scale, wy = y + face + top*scale;
    const windowW = state.w*scale, windowH = state.h*scale;
    const texRatio = {sea:216/70, linen:216/96, cherry:216/33, ink:216/42, sage:216/66}[profile.id];
    const S = sel => svg.querySelector('[data-'+sel+']');
    attrs(S('pattern'),{width:face*texRatio, height:face});
    attrs(S('grain'),{href:'assets/grain-'+profile.id+'.webp',width:face*texRatio,height:face});
    const picBounds = {x:wx,y:wy,width:windowW,height:windowH};
    for (const key of ['clip','paper','bevel']) attrs(S(key),picBounds);
    const factor = (state.fit==='cover' ? Math.max : Math.min)(windowW/sourceSize.w,windowH/sourceSize.h);
    const artWidth=sourceSize.w*factor, artHeight=sourceSize.h*factor;
    attrs(S('picture'),{x:wx+(windowW-artWidth)/2,y:wy+(windowH-artHeight)/2,
      width:artWidth,height:artHeight,href:imageURL,preserveAspectRatio:'xMidYMid meet'});
    const board = rectangle(x+face-.2,y+face-.2,W-2*face+.4,H-2*face+.4)+' '+rectangle(wx,wy,windowW,windowH);
    attrs(S('boardbase'),{d:board,fill:mat?.color || 'transparent'});
    attrs(S('boardink'),{d:board});
    S('board').setAttribute('display', mat?'inline':'none');
    if (mat) S('mat-texture').setAttribute('href','assets/mat-'+mat.id+'.webp');
    const corners = [[x,y,0,W],[x+W,y,90,H],[x+W,y+H,180,W],[x,y+H,270,H]];
    svg.querySelectorAll('[data-rail]').forEach((g,i) => {
      const [sx,sy,angle,length] = corners[i];
      const p = 'M0 0H'+length+'L'+(length-face)+' '+face+'H'+face+'Z';
      g.querySelector('[data-place]').setAttribute('transform','translate('+sx+' '+sy+') rotate('+angle+')');
      g.querySelector('[data-face]').setAttribute('d',p);
      g.querySelector('[data-tone]').setAttribute('d',p);
      g.querySelector('[data-lip]').setAttribute('d','M'+face+' '+face+'H'+(length-face));
    });
    const fmt=x=>Number(x.toFixed(1)).toLocaleString('ru-RU');
    svg.setAttribute('aria-label','Эскиз '+fmt(totalW)+' на '+fmt(totalH)+' см. '+profile.name+(mat?', паспарту '+mat.name:', без паспарту'));
    return {totalW,totalH,profile,mat};
  }
  function splitFrame(svg, amount) {
    if (!svg || marks.get(svg)===amount) return;
    marks.set(svg,amount);
    const k = svg.dataset.frame==='layers' ? 1 : .52;
    const delta = amount*k;
    const offsets = [[-15,-44],[55,-9],[15,48],[-56,8]];
    svg.querySelectorAll('[data-rail]').forEach((rail,i) => {
      const [dx,dy]=offsets[i];
      rail.setAttribute('transform','translate('+(dx*delta)+' '+(dy*delta)+')');
    });
    svg.querySelector('[data-board]').setAttribute('transform','translate('+(-31*delta)+' '+(-9*delta)+')');
    svg.querySelector('[data-sheet]').setAttribute('transform','translate('+(61*delta)+' '+(19*delta)+')');
    if (svg.dataset.frame==='layers') svg.querySelector('[data-pose]').setAttribute('transform','rotate('+(-5*amount)+' 250 215)');
  }
  for (const svg of document.querySelectorAll('[data-frame]')) geometry(svg,defaults);
  window.Bagetbat = Object.freeze({geometry, materials, defaults, artwork});
  const hero = document.querySelector('[data-hero-scene]');
  const heroFrame = document.querySelector('[data-frame="hero"]');
  const layers = document.querySelector('[data-frame="layers"]');
  const lowerArt = [...document.querySelectorAll('[data-scroll-art]')];
  let queued = false;
  function drawScroll() {
    queued=false;
    if (heroFrame) splitFrame(heroFrame,motion.matches ? 0 : clamp(scrollY / Math.max(190,innerHeight*.48)));
    for (const el of lowerArt) {
      const r=el.getBoundingClientRect();
      const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
      el.style.setProperty('--scroll',motion.matches ? '.47' : progress.toFixed(4));
      if (layers && el.contains(layers)) splitFrame(layers,motion.matches ? .69 : .16+clamp(progress*1.4)*1.08);
    }
  }
  function scrollUpdate() { if (!queued) {queued=true;requestAnimationFrame(drawScroll);} }
  addEventListener('scroll', scrollUpdate, {passive:true});
  addEventListener('resize', scrollUpdate);
  motion.addEventListener('change',scrollUpdate);
  drawScroll();
  const object = hero?.querySelector('.hero-object');
  function placeHero(x=0,y=0) {
    if (!object) return;
    for (const [p,v] of Object.entries({'--px':x*13+'px','--py':y*8+'px','--rx':-y*9+'deg','--ry':x*13+'deg'})) object.style.setProperty(p,v);
  }
  hero?.addEventListener('pointermove',ev=>{
    if (ev.pointerType==='touch'||motion.matches||!fine.matches) return;
    const box=hero.getBoundingClientRect();
    placeHero(clamp((ev.clientX-box.left)/box.width*2-1,-1,1),clamp((ev.clientY-box.top)/box.height*2-1,-1,1));
  });
  hero?.addEventListener('pointerleave',()=>placeHero());
  const contact=document.querySelector('.contact');
  function placeContact(x=0,y=0) { contact.style.setProperty('--mx',x+'px');contact.style.setProperty('--my',y+'px'); }
  contact.addEventListener('pointermove',ev=>{
    if (ev.pointerType==='touch'||motion.matches||!fine.matches) return;
    const box=contact.getBoundingClientRect();
    placeContact(clamp((ev.clientX-box.left)/box.width*2-1,-1,1)*3,clamp((ev.clientY-box.top)/box.height*2-1,-1,1)*2);
  });
  contact.addEventListener('pointerleave',()=>placeContact());
  motion.addEventListener('change',()=>{placeHero();placeContact();});
  const toggle=document.querySelector('.menu-toggle'),menu=document.querySelector('#mobile-nav');
  function closeMenu(restoreFocus=false) {
    menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');
    if(restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click',()=>{
    if(!menu.hidden) {closeMenu();return;}
    menu.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть меню');
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();closeMenu(true);}});
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('.mobile-nav,.menu-toggle'))closeMenu();});
  document.addEventListener('focusin',e=>{if(!menu.hidden&&!e.target.closest('.mobile-nav,.menu-toggle'))closeMenu();});
  menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  matchMedia('(max-width:740px)').addEventListener('change',()=>closeMenu());
  addEventListener('pageshow',()=>{closeMenu();scrollUpdate();});
})();
